
"use client";

import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type StudyNote = {
  id: string;
  title: string;
  content: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type CourseDetails = {
  country: string;
  university: string;
  program: string;
  level: string;
  semester: string;
  course: string;
};

type Material = {
  id: string;
  file: File;
  kind: string;
  status: "ready" | "processing" | "error";
  text: string;
  progress?: string;
  error?: string;
  previewUrl?: string;
  downloadUrl?: string;
};

type ExtractedSection = {
  label: string;
  text: string;
};

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractXmlText(xml: string) {
  return [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)]
    .map((match) => decodeXml(match[1]))
    .join(" ");
}

export default function StudyPage() {
  const [details, setDetails] = useState<CourseDetails>({
    country: "",
    university: "",
    program: "",
    level: "",
    semester: "",
    course: "",
  });

  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [notesReady, setNotesReady] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState("assistant");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [previewSection, setPreviewSection] = useState(0);

  const materialsRef = useRef<Material[]>([]);

  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  useEffect(() => {
    return () => {
      const released = new Set<string>();

      materialsRef.current.forEach((material) => {
        [material.previewUrl, material.downloadUrl].forEach((url) => {
          if (url && !released.has(url)) {
            URL.revokeObjectURL(url);
            released.add(url);
          }
        });
      });
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setDetails({
      country: params.get("country") ?? "",
      university: params.get("university") ?? "",
      program: params.get("program") ?? "",
      level: params.get("level") ?? "",
      semester: params.get("semester") ?? "",
      course: params.get("course") ?? "",
    });
  }, []);

  useEffect(() => {
    if (!details.course) {
      setNotesReady(false);
      setNotes([]);
      return;
    }

    setNotesReady(false);

    try {
      const saved = localStorage.getItem(
        `studyhub-notes:${details.course}`
      );

      setNotes(saved ? (JSON.parse(saved) as StudyNote[]) : []);
    } catch {
      setNotes([]);
    }

    setNotesReady(true);
  }, [details.course]);

  useEffect(() => {
    if (!notesReady || !details.course) return;

    try {
      localStorage.setItem(
        `studyhub-notes:${details.course}`,
        JSON.stringify(notes)
      );
    } catch (error) {
      console.error("Could not save notes:", error);
    }
  }, [notes, notesReady, details.course]);

  function addNote() {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const note: StudyNote = {
      id: crypto.randomUUID(),
      title: noteTitle.trim() || "Untitled note",
      content: noteContent.trim(),
    };

    setNotes((previous) => [note, ...previous]);
    setNoteTitle("");
    setNoteContent("");
  }

  function updateNote(id: string, changes: Partial<StudyNote>) {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id ? { ...note, ...changes } : note
      )
    );
  }

  function deleteNote(id: string) {
    setNotes((previous) => previous.filter((note) => note.id !== id));
  }

  // AI ASSISTANT
  async function askAssistant() {
    const userMessage = question.trim();

    if (!userMessage || isThinking) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: userMessage },
    ]);

    setQuestion("");
    setIsThinking(true);

    try {
      // Include notes belonging to the currently selected course.
      const relevantNotes = notes
        .filter((note) => note.title.trim() || note.content.trim())
        .slice(0, 10)
        .map((note) => ({
          title: note.title.slice(0, 200),
          content: note.content.slice(0, 3000),
        }));

      // Limit the total extracted material context to 30,000 characters.
      const relevantMaterials: {
        name: string;
        kind: string;
        text: string;
      }[] = [];

      let remainingCharacters = 30000;

      for (const material of materials) {
        if (
          material.status !== "ready" ||
          !material.text.trim() ||
          remainingCharacters <= 0 ||
          relevantMaterials.length >= 5
        ) {
          continue;
        }

        const text = material.text.slice(0, remainingCharacters);

        relevantMaterials.push({
          name: material.file.name.slice(0, 250),
          kind: material.kind,
          text,
        });

        remainingCharacters -= text.length;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          course: details.course,
          courseDetails: details,
          notes: relevantNotes,
          materials: relevantMaterials,
        }),
      });

      const responseText = await response.text();

      let data: {
        reply?: string;
        error?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `The AI request failed (HTTP ${response.status}).`
        );
      }

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error(
          "The AI returned an empty response. Please try again."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply!.trim(),
        },
      ]);
    } catch (error) {
      console.error("StudyHub AI error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? `Sorry, I couldn't answer that. ${error.message}`
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  async function processFile(
    file: File,
    onProgress?: (message: string) => void
  ): Promise<Material> {
    const extension = getExtension(file.name);
    const id = crypto.randomUUID();

    const imageExtensions = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "bmp",
    ];

    const imageTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];

    const imageFile =
      imageExtensions.includes(extension) ||
      imageTypes.includes(file.type);

    const downloadUrl = URL.createObjectURL(file);

    const previewUrl =
      extension === "pdf" || imageFile
        ? downloadUrl
        : undefined;

    const base: Material = {
      id,
      file,
      kind: extension.toUpperCase() || "FILE",
      status: "processing",
      text: "",
      progress: "Preparing document...",
      previewUrl,
      downloadUrl,
    };

    const ocrWorkerRef: { current: OcrWorker | null } = {
      current: null,
    };

    async function getOcrWorker(): Promise<OcrWorker> {
      if (!ocrWorkerRef.current) {
        onProgress?.(
          "Starting OCR engine. This may take a moment..."
        );

        ocrWorkerRef.current = await createWorker("eng");
      }

      return ocrWorkerRef.current;
    }

    try {
      // PDF text extraction and OCR for scanned pages.
      if (extension === "pdf") {
        onProgress?.("Opening PDF...");

        const pdfjs = await import("pdfjs-dist");

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjs.getDocument({
          data: await file.arrayBuffer(),
        }).promise;

        const sections: ExtractedSection[] = [];

        try {
          for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
          ) {
            onProgress?.(
              `Reading PDF page ${pageNumber} of ${pdf.numPages}...`
            );

            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();

            let text = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ")
              .trim();

            if (text.length < 25) {
              let canvas: HTMLCanvasElement | null = null;

              try {
                onProgress?.(
                  `Running OCR on page ${pageNumber} of ${pdf.numPages}...`
                );

                const worker = await getOcrWorker();
                const viewport = page.getViewport({ scale: 2 });

                canvas = document.createElement("canvas");
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);

                const context = canvas.getContext("2d");

                if (!context) {
                  throw new Error(
                    "Could not prepare this PDF page for OCR."
                  );
                }

                await page.render({
                  canvas,
                  canvasContext: context,
                  viewport,
                }).promise;

                const result = await worker.recognize(canvas);
                const recognizedText = result.data.text.trim();

                if (recognizedText) {
                  text = recognizedText;
                } else if (!text) {
                  text = "[No readable text detected on this page.]";
                }
              } catch (error) {
                console.error(
                  `OCR failed on PDF page ${pageNumber}:`,
                  error
                );

                if (!text) {
                  text = "[OCR could not read this page.]";
                }
              } finally {
                if (canvas) {
                  canvas.width = 0;
                  canvas.height = 0;
                }
              }
            }

            sections.push({
              label: `Page ${pageNumber}`,
              text: text || "[No text found on this page.]",
            });

            page.cleanup();
          }

          return {
            ...base,
            status: "ready",
            progress: `Finished reading ${pdf.numPages} PDF page(s).`,
            text: sections
              .map(
                (section) => `${section.label}\n${section.text}`
              )
              .join("\n\n"),
          };
        } finally {
          await pdf.loadingTask.destroy();
        }
      }

      // Images.
      if (imageFile) {
        onProgress?.("Recognizing text in image...");

        const worker = await getOcrWorker();
        const result = await worker.recognize(file);
        const text = result.data.text.trim();

        return {
          ...base,
          status: "ready",
          progress: "Image OCR complete.",
          text: text || "[No readable text detected in this image.]",
        };
      }

      // Word documents.
      if (extension === "docx") {
        onProgress?.("Extracting Word document text...");

        const mammoth = await import("mammoth/mammoth.browser");

        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });

        return {
          ...base,
          status: "ready",
          progress: "Document reading complete.",
          text: result.value.trim(),
        };
      }

      // PowerPoint presentations.
      if (extension === "pptx") {
        onProgress?.("Reading presentation slides...");

        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(file);

        const slideFiles = Object.keys(zip.files)
          .filter((name) =>
            /^ppt\/slides\/slide\d+\.xml$/.test(name)
          )
          .sort((a, b) => {
            const numberA = Number(
              a.match(/slide(\d+)\.xml$/)?.[1] ?? 0
            );

            const numberB = Number(
              b.match(/slide(\d+)\.xml$/)?.[1] ?? 0
            );

            return numberA - numberB;
          });

        const sections: ExtractedSection[] = [];

        for (const slideFile of slideFiles) {
          const slideNumber = Number(
            slideFile.match(/slide(\d+)\.xml$/)?.[1] ?? 0
          );

          const xml = await zip.file(slideFile)?.async("text");

          sections.push({
            label: `Slide ${slideNumber}`,
            text: xml ? extractXmlText(xml) : "",
          });
        }

        return {
          ...base,
          status: "ready",
          progress: "Presentation reading complete.",
          text: sections
            .map(
              (section) => `${section.label}\n${section.text}`
            )
            .join("\n\n"),
        };
      }

      // Spreadsheets and CSV files.
      if (
        extension === "xlsx" ||
        extension === "xls" ||
        extension === "csv"
      ) {
        onProgress?.("Reading spreadsheet...");

        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();

        const workbook =
          extension === "csv"
            ? XLSX.read(await file.text(), { type: "string" })
            : XLSX.read(buffer, { type: "array" });

        const sections = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];

          return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
        });

        return {
          ...base,
          status: "ready",
          progress: "Spreadsheet reading complete.",
          text: sections.join("\n\n"),
        };
      }

      // Text-based files.
      if (
        [
          "txt",
          "md",
          "json",
          "xml",
          "html",
          "log",
          "yaml",
          "yml",
          "tsv",
        ].includes(extension) ||
        file.type.startsWith("text/")
      ) {
        onProgress?.("Reading text file...");

        const text = await file.text();
        let extractedText = text;

        if (extension === "json") {
          try {
            extractedText = JSON.stringify(
              JSON.parse(text),
              null,
              2
            );
          } catch {
            extractedText = text;
          }
        }

        return {
          ...base,
          status: "ready",
          progress: "Text reading complete.",
          text: extractedText,
        };
      }

      return {
        ...base,
        status: "error",
        error:
          "This file type is not supported for text extraction yet. Try PDF, DOCX, PPTX, XLSX, CSV, TXT, or an image.",
      };
    } catch (error) {
      console.error("File processing failed:", error);

      return {
        ...base,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "We could not read this file. Try another file or format.",
      };
    } finally {
      if (ocrWorkerRef.current) {
        try {
          await ocrWorkerRef.current.terminate();
        } catch (error) {
          console.error("Could not stop OCR worker:", error);
        } finally {
          ocrWorkerRef.current = null;
        }
      }
    }
  }

  async function handleFiles(selectedFiles: File[]) {
    for (const file of selectedFiles) {
      const duplicate = materials.some(
        (material) =>
          material.file.name === file.name &&
          material.file.size === file.size &&
          material.file.lastModified === file.lastModified
      );

      if (duplicate) continue;

      const placeholder: Material = {
        id: crypto.randomUUID(),
        file,
        kind: getExtension(file.name).toUpperCase() || "FILE",
        status: "processing",
        text: "",
        progress: "Preparing file...",
      };

      setMaterials((previous) => [...previous, placeholder]);
      setSelectedMaterialId(placeholder.id);

      const result = await processFile(file, (progress) => {
        setMaterials((previous) =>
          previous.map((material) =>
            material.id === placeholder.id
              ? { ...material, progress }
              : material
          )
        );
      });

      setMaterials((previous) =>
        previous.map((material) =>
          material.id === placeholder.id
            ? { ...result, id: placeholder.id }
            : material
        )
      );
    }
  }

  function removeMaterial(id: string) {
    const material = materials.find((item) => item.id === id);

    if (material) {
      const urls = new Set([
        material.previewUrl,
        material.downloadUrl,
      ]);

      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    }

    setMaterials((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (selectedMaterialId === id) {
      setSelectedMaterialId("");
      setPreviewSection(0);
    }
  }

  const selectedMaterial = materials.find(
    (material) => material.id === selectedMaterialId
  );

  const materialSections: ExtractedSection[] = selectedMaterial?.text
    ? selectedMaterial.text
        .split(/\n(?=(?:Page \d+|Slide \d+|Sheet: [^\n]+)\n)/)
        .map((block) => {
          const newline = block.indexOf("\n");

          return newline === -1
            ? { label: "Extracted text", text: block }
            : {
                label: block.slice(0, newline),
                text: block.slice(newline + 1),
              };
        })
    : [];

  const tabs = [
    { id: "assistant", label: "AI Assistant", icon: "✦" },
    { id: "notes", label: "My Notes", icon: "▤" },
    { id: "materials", label: "My Materials", icon: "⇧" },
  ];

  return (
    <main className="min-h-screen bg-[#090B10] text-[#F1F5F9]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#090B10]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="text-2xl font-black tracking-tight">
            Study<span className="text-[#4169E1]">Hub</span>
          </a>

          <nav className="flex items-center gap-4 text-sm text-slate-400 sm:gap-6">
            <a href="/" className="transition hover:text-white">
              Home
            </a>
            <a href="/courses" className="transition hover:text-white">
              Course Finder
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8EAFFF]">
            YOUR PERSONAL WORKSPACE
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Time to <span className="text-[#8EAFFF]">learn.</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Your notes, AI study assistant, and learning materials —
            organized in one place.
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-[#4169E1]/30 bg-gradient-to-br from-[#151A25] to-[#10141D] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8EAFFF]">
                CURRENT COURSE
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                {details.course || "No course selected yet"}
              </h2>

              {details.course ? (
                <>
                  <p className="mt-2 text-sm text-slate-300">
                    {details.program} · {details.level} · {details.semester}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {details.university}, {details.country}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  Choose your course to personalize your workspace.
                </p>
              )}
            </div>

            <a
              href="/courses"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#4169E1]/50 bg-[#4169E1]/10 px-5 py-3 text-sm font-semibold text-[#AFC4FF] transition hover:bg-[#4169E1]/20"
            >
              {details.course ? "Change course" : "Find a course"} →
            </a>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#4169E1] text-white"
                    : "bg-[#151A25] text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI ASSISTANT TAB */}
          {activeTab === "assistant" && (
            <div className="rounded-2xl border border-white/10 bg-[#11141D] p-5 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]/15 text-2xl text-[#8EAFFF]">
                  ✦
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    AI Study Assistant
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Your course-focused learning companion
                  </p>
                </div>
              </div>

              <div
                aria-live="polite"
                className="mb-5 min-h-64 space-y-4 rounded-xl border border-white/5 bg-[#090B10] p-4 sm:p-5"
              >
                {messages.length === 0 ? (
                  <div className="flex min-h-56 flex-col items-center justify-center text-center">
                    <span className="mb-4 text-4xl text-[#8EAFFF]">
                      ✦
                    </span>

                    <h3 className="font-semibold">
                      What would you like to understand?
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Ask about a difficult concept, request an explanation,
                      or ask questions about your uploaded lecture materials.
                    </p>

                    {details.course && (
                      <span className="mt-4 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                        Course: {details.course}
                      </span>
                    )}

                    {materials.some(
                      (material) => material.status === "ready"
                    ) && (
                      <span className="mt-2 text-xs text-slate-500">
                        Your processed study materials are available as context.
                      </span>
                    )}
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-4 text-sm leading-6 ${
                        message.role === "user"
                          ? "ml-4 bg-[#4169E1]/15 text-white sm:ml-12"
                          : "mr-4 border border-white/5 bg-[#151A25] text-slate-300 sm:mr-12"
                      }`}
                    >
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8EAFFF]">
                        {message.role === "user" ? "You" : "StudyHub AI"}
                      </p>

                      <div className="space-y-3 text-sm leading-7">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="mb-3 mt-4 text-xl font-bold text-white">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="mb-3 mt-4 text-lg font-bold text-white">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="mb-2 mt-3 text-base font-bold text-white">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-3 list-disc space-y-1 pl-6">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-3 list-decimal space-y-1 pl-6">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong className="font-bold text-white">
                                {children}
                              </strong>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="my-3 border-l-2 border-[#8EAFFF] pl-4 italic text-slate-400">
                                {children}
                              </blockquote>
                            ),
                            hr: () => <hr className="my-4 border-white/10" />,
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#8EAFFF] underline hover:text-white"
                              >
                                {children}
                              </a>
                            ),
                            pre: ({ children }) => (
                              <pre className="my-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs leading-5">
                                {children}
                              </pre>
                            ),
                            code: ({ children, className }) => (
                              <code
                                className={`${className ?? ""} rounded bg-black/20 px-1`}
                              >
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}

                {isThinking && (
                  <div
                    role="status"
                    className="mr-4 rounded-xl border border-white/5 bg-[#151A25] p-4 text-sm text-slate-400 sm:mr-12"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4169E1] border-t-transparent" />
                      StudyHub AI is thinking...
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void askAssistant();
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask a question about your course..."
                  disabled={isThinking}
                  maxLength={10000}
                  required
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#090B10] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-[#4169E1] disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={isThinking || !question.trim()}
                  className="rounded-xl bg-[#4169E1] px-6 py-3.5 text-sm font-bold transition hover:bg-[#3156CB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isThinking ? "Thinking..." : "Ask question ↗"}
                </button>
              </form>

              <p className="mt-3 text-xs text-slate-500">
                StudyHub AI can use your selected course, saved notes, and
                processed study materials when the API supports this context.
              </p>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#11141D] p-5 sm:p-7">
                <h2 className="text-xl font-bold">Create a note</h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Capture key concepts, summaries, and revision points.
                </p>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addNote();
                  }}
                >
                  <input
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="Note title"
                    className="w-full rounded-xl border border-white/10 bg-[#090B10] px-4 py-3 text-sm outline-none focus:border-[#4169E1]"
                  />

                  <textarea
                    value={noteContent}
                    onChange={(event) => setNoteContent(event.target.value)}
                    placeholder="Write your notes here..."
                    rows={7}
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#090B10] px-4 py-3 text-sm leading-6 outline-none focus:border-[#4169E1]"
                  />

                  <button
                    type="submit"
                    disabled={!noteTitle.trim() && !noteContent.trim()}
                    className="w-full rounded-xl bg-[#4169E1] px-5 py-3 font-semibold transition hover:bg-[#3156CB] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Create note
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#11141D] p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Your notes</h2>

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                    {notes.length} {notes.length === 1 ? "note" : "notes"}
                  </span>
                </div>

                {!details.course ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
                    Select a course to keep its notes organized in a
                    course-specific workspace.
                  </p>
                ) : !notesReady ? (
                  <p className="text-sm text-slate-400">
                    Loading your notes...
                  </p>
                ) : notes.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <span className="text-3xl text-[#8EAFFF]">▤</span>
                    <p className="mt-3 font-semibold">No notes yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Your notes for this course will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <article
                        key={note.id}
                        className="rounded-xl border border-white/10 bg-[#090B10] p-4"
                      >
                        <input
                          value={note.title}
                          aria-label="Edit note title"
                          onChange={(event) =>
                            updateNote(note.id, {
                              title: event.target.value,
                            })
                          }
                          className="w-full bg-transparent text-base font-bold outline-none focus:text-[#AFC4FF]"
                        />

                        <textarea
                          value={note.content}
                          aria-label="Edit note content"
                          onChange={(event) =>
                            updateNote(note.id, {
                              content: event.target.value,
                            })
                          }
                          rows={4}
                          className="mt-3 w-full resize-y bg-transparent text-sm leading-6 text-slate-300 outline-none focus:text-white"
                        />

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="text-xs font-semibold text-red-400 transition hover:text-red-300"
                          >
                            Delete note
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Notes are saved in this browser, organized by course.
                  They are not yet synced between devices or accounts.
                </p>
              </div>
            </div>
          )}

          {/* MATERIALS TAB */}
          {activeTab === "materials" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#11141D] p-5 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">
                    Upload study materials
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Upload documents, presentations, spreadsheets, text files,
                    or images. OCR can recognize text in scanned PDF pages
                    and images.
                  </p>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#4169E1]/50 bg-[#4169E1]/5 px-5 py-12 text-center transition hover:bg-[#4169E1]/10">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4169E1]/15 text-3xl text-[#8EAFFF]">
                    ⇧
                  </span>

                  <span className="font-semibold">
                    Choose files from your device
                  </span>

                  <span className="mt-2 text-sm text-slate-500">
                    PDF, DOCX, PPTX, XLSX, CSV, TXT, JSON, images, and more
                  </span>

                  <input
                    type="file"
                    multiple
                    accept="*/*"
                    className="sr-only"
                    onChange={(event) => {
                      void handleFiles(
                        Array.from(event.target.files ?? [])
                      );
                      event.target.value = "";
                    }}
                  />
                </label>

                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">Your materials</h3>

                    <span className="text-xs text-slate-500">
                      {materials.length}{" "}
                      {materials.length === 1 ? "file" : "files"}
                    </span>
                  </div>

                  {materials.length === 0 ? (
                    <p className="rounded-xl border border-white/5 bg-[#090B10] p-5 text-sm text-slate-500">
                      Choose a file to begin previewing and extracting its text.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                            selectedMaterialId === material.id
                              ? "border-[#4169E1]/50 bg-[#4169E1]/5"
                              : "border-white/10 bg-[#090B10]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMaterialId(material.id);
                              setPreviewSection(0);
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-semibold">
                              {material.file.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {material.kind} ·{" "}
                              {(material.file.size / 1024).toFixed(1)} KB ·{" "}
                              {material.status === "processing"
                                ? material.progress || "Processing..."
                                : material.status === "error"
                                  ? "Could not read"
                                  : "Ready to view"}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeMaterial(material.id)}
                            className="shrink-0 text-xs font-semibold text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Files are processed locally in this browser. Extracted text
                  is sent to your AI endpoint when you ask a question.
                  Files are not permanently saved by this component.
                </p>
              </div>

              {selectedMaterial && (
                <div className="rounded-2xl border border-white/10 bg-[#11141D] p-5 sm:p-8">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#8EAFFF]">
                        DOCUMENT READER
                      </p>

                      <h2 className="mt-2 break-all text-xl font-bold">
                        {selectedMaterial.file.name}
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        Preview and extracted text
                      </p>
                    </div>

                    {selectedMaterial.downloadUrl && (
                      <a
                        href={selectedMaterial.downloadUrl}
                        download={selectedMaterial.file.name}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                      >
                        Download original
                      </a>
                    )}
                  </div>

                  {selectedMaterial.status === "processing" ? (
                    <div className="rounded-xl bg-[#090B10] p-5 text-sm text-slate-400">
                      <p>
                        {selectedMaterial.progress || "Reading your file..."}
                      </p>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#4169E1]" />
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        OCR can take longer for large scans or pages with
                        small text. Keep this page open while processing.
                      </p>
                    </div>
                  ) : selectedMaterial.status === "error" ? (
                    <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm leading-6 text-red-300">
                      {selectedMaterial.error}
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {selectedMaterial.previewUrl &&
                        selectedMaterial.kind === "PDF" && (
                          <iframe
                            title="PDF preview"
                            src={selectedMaterial.previewUrl}
                            className="h-[600px] w-full rounded-xl border border-white/10 bg-white"
                          />
                        )}

                      {selectedMaterial.previewUrl &&
                        [
                          "PNG",
                          "JPG",
                          "JPEG",
                          "GIF",
                          "WEBP",
                          "BMP",
                        ].includes(selectedMaterial.kind) && (
                          <div className="flex max-h-[600px] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-[#090B10] p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedMaterial.previewUrl}
                              alt={selectedMaterial.file.name}
                              className="max-h-[560px] max-w-full object-contain"
                            />
                          </div>
                        )}

                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-bold">Extracted text</h3>

                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard
                                .writeText(selectedMaterial.text)
                                .catch((error) => {
                                  console.error(
                                    "Could not copy extracted text:",
                                    error
                                  );
                                });
                            }}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                          >
                            Copy text
                          </button>
                        </div>

                        {selectedMaterial.text ? (
                          <div className="max-h-[500px] overflow-auto rounded-xl border border-white/10 bg-[#090B10] p-4">
                            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-300">
                              {selectedMaterial.text}
                            </pre>
                          </div>
                        ) : (
                          <p className="rounded-xl bg-[#090B10] p-5 text-sm text-slate-500">
                            No text was found in this file.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          StudyHub © 2026 · Your learning, organized.
        </footer>
      </div>
    </main>
  );
}
