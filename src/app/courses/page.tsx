
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const catalogue = {
  Ghana: {
    "University of Ghana": {
      "Computer Science": {
        "Level 100": {
          "Semester 1": [
            "Introduction to Computer Science",
            "Introduction to Mathematics",
          ],
          "Semester 2": ["Programming Fundamentals", "Discrete Mathematics"],
        },
        "Level 200": {
          "Semester 1": ["Data Structures", "Database Systems"],
          "Semester 2": ["Algorithms", "Computer Organization"],
        },
      },
      "Business Administration": {
        "Level 100": {
          "Semester 1": ["Introduction to Business", "Business Mathematics"],
          "Semester 2": ["Principles of Management", "Business Communication"],
        },
        "Level 200": {
          "Semester 1": ["Marketing Management", "Financial Accounting"],
          "Semester 2": ["Organizational Behaviour", "Business Statistics"],
        },
      },
    },
    KNUST: {
      "Computer Science": {
        "Level 100": {
          "Semester 1": ["Computing Fundamentals", "Mathematics"],
          "Semester 2": ["Programming Fundamentals", "Digital Systems"],
        },
        "Level 200": {
          "Semester 1": ["Data Structures", "Computer Architecture"],
          "Semester 2": ["Algorithms", "Database Systems"],
        },
      },
      Engineering: {
        "Level 100": {
          "Semester 1": ["Engineering Mathematics", "Engineering Science"],
          "Semester 2": ["Technical Drawing", "Applied Mechanics"],
        },
        "Level 200": {
          "Semester 1": ["Electrical Circuits", "Engineering Mathematics"],
          "Semester 2": ["Thermodynamics", "Engineering Design"],
        },
      },
    },
  },
  Nigeria: {
    "University of Lagos": {
      "Computer Science": {
        "Level 100": {
          "Semester 1": ["Introduction to Computing", "General Mathematics"],
          "Semester 2": ["Programming Fundamentals", "Computer Applications"],
        },
        "Level 200": {
          "Semester 1": ["Data Structures", "Computer Architecture"],
          "Semester 2": ["Algorithms", "Database Systems"],
        },
      },
      "Business Administration": {
        "Level 100": {
          "Semester 1": ["Introduction to Business", "Business Mathematics"],
          "Semester 2": ["Principles of Management", "Business Communication"],
        },
        "Level 200": {
          "Semester 1": ["Marketing", "Financial Accounting"],
          "Semester 2": ["Organizational Behaviour", "Business Statistics"],
        },
      },
    },
    "University of Ibadan": {
      "Computer Science": {
        "Level 100": {
          "Semester 1": ["Introduction to Computing", "Mathematics"],
          "Semester 2": ["Programming Fundamentals", "Computer Applications"],
        },
        "Level 200": {
          "Semester 1": ["Data Structures", "Computer Architecture"],
          "Semester 2": ["Algorithms", "Database Systems"],
        },
      },
      Economics: {
        "Level 100": {
          "Semester 1": ["Principles of Economics", "Mathematics for Economics"],
          "Semester 2": ["Microeconomics", "Statistics"],
        },
        "Level 200": {
          "Semester 1": ["Macroeconomics", "Econometrics"],
          "Semester 2": ["Development Economics", "Public Finance"],
        },
      },
    },
  },
} as const;

type Country = keyof typeof catalogue;
type University = keyof (typeof catalogue)[Country];

const levels = ["Level 100", "Level 200", "Level 300", "Level 400"];
const semesters = ["Semester 1", "Semester 2"];

export default function CoursesPage() {
  const router = useRouter();

  const [country, setCountry] = useState<Country | "">("");
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [level, setLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [course, setCourse] = useState("");

  const universities = useMemo(
    () => (country ? Object.keys(catalogue[country]) : []),
    [country]
  );

  const programs = useMemo(() => {
    if (!country || !university) return [];

    return Object.keys(catalogue[country][university as University] ?? {});
  }, [country, university]);

  const availableCourses = useMemo(() => {
    if (!country || !university || !program || !level || !semester) {
      return [];
    }

    const universityData = catalogue[country][university as University];
    const programData =
      universityData?.[program as keyof typeof universityData];

    if (!programData) return [];

    const levelData = programData[level as keyof typeof programData];

    if (!levelData) return [];

    return [...(levelData[semester as keyof typeof levelData] ?? [])];
  }, [country, university, program, level, semester]);

  const canChooseUniversity = Boolean(country);
  const canChooseProgram = Boolean(country && university);
  const canChooseLevel = Boolean(country && university && program);
  const canChooseSemester = Boolean(
    country && university && program && level
  );

  function resetFromCountry(value: Country | "") {
    setCountry(value);
    setUniversity("");
    setProgram("");
    setLevel("");
    setSemester("");
    setCourse("");
  }

  function resetFromUniversity(value: string) {
    setUniversity(value);
    setProgram("");
    setLevel("");
    setSemester("");
    setCourse("");
  }

  function resetFromProgram(value: string) {
    setProgram(value);
    setLevel("");
    setSemester("");
    setCourse("");
  }

  function resetFromLevel(value: string) {
    setLevel(value);
    setSemester("");
    setCourse("");
  }

  function resetFromSemester(value: string) {
    setSemester(value);
    setCourse("");
  }

  function continueToStudy() {
    if (!course) return;

    const params = new URLSearchParams({
      country,
      university,
      program,
      level,
      semester,
      course,
    });

    router.push(`/study?${params.toString()}`);
  }

  const fields = [
    {
      label: "Country",
      value: country,
      options: Object.keys(catalogue),
      enabled: true,
      change: (value: string) => resetFromCountry(value as Country),
      placeholder: "Choose a country",
    },
    {
      label: "University",
      value: university,
      options: universities,
      enabled: canChooseUniversity,
      change: resetFromUniversity,
      placeholder: "Choose a university",
    },
    {
      label: "Program",
      value: program,
      options: programs,
      enabled: canChooseProgram,
      change: resetFromProgram,
      placeholder: "Choose your program",
    },
    {
      label: "Academic level",
      value: level,
      options: levels,
      enabled: canChooseLevel,
      change: resetFromLevel,
      placeholder: "Choose your level",
    },
    {
      label: "Semester",
      value: semester,
      options: semesters,
      enabled: canChooseSemester,
      change: resetFromSemester,
      placeholder: "Choose a semester",
    },
  ];

  return (
    <main className="min-h-screen bg-[#090B10] text-[#F1F5F9]">
      <header className="border-b border-white/[0.08] bg-[#090B10]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4169E1] text-xl font-bold text-white">
              S
            </span>
            <span className="text-xl font-extrabold">
              Study<span className="text-[#4169E1]">Hub</span>
            </span>
          </a>

          <a
            href="/"
            className="text-sm font-medium text-slate-400 transition hover:text-[#8EAFFF]"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[#4169E1]/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="text-center">
            <span className="inline-flex rounded-full border border-[#4169E1]/30 bg-[#4169E1]/10 px-4 py-2 text-sm font-semibold text-[#AFC4FF]">
              YOUR LEARNING JOURNEY
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
              Find your <span className="text-[#4169E1]">course.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">
              Tell us where and what you study. We’ll use your selections
              to help organize your learning experience.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-white/[0.09] bg-[#10141D] p-5 shadow-2xl shadow-black/30 sm:p-9">
            <div className="mb-8">
              <h2 className="text-xl font-bold">Course details</h2>
              <p className="mt-2 text-sm text-slate-400">
                Start with your country, then make your way through the options.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {fields.map((field, index) => (
                <div
                  key={field.label}
                  className={index === 0 ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={`field-${index}`}
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    {index + 1}. {field.label}
                  </label>

                  <select
                    id={`field-${index}`}
                    value={field.value}
                    disabled={!field.enabled}
                    onChange={(event) => field.change(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#151A25] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#4169E1] focus:ring-4 focus:ring-[#4169E1]/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="sm:col-span-2">
                <label
                  htmlFor="field-course"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  6. Course
                </label>

                <select
                  id="field-course"
                  value={course}
                  disabled={!semester || availableCourses.length === 0}
                  onChange={(event) => setCourse(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#151A25] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#4169E1] focus:ring-4 focus:ring-[#4169E1]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">Choose a course</option>
                  {availableCourses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {course && (
              <div className="mt-8 rounded-2xl border border-[#4169E1]/30 bg-[#4169E1]/10 p-5">
                <p className="text-sm font-semibold text-[#8EAFFF]">
                  YOUR SELECTED COURSE
                </p>
                <h3 className="mt-2 text-xl font-bold">{course}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {program} · {level} · {semester}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {university}, {country}
                </p>
                <p className="mt-4 text-sm text-slate-400">
                  This is a prototype selection. Verified course details
                  and AI study tools will be connected in later steps.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => resetFromCountry("")}
                className="rounded-xl border border-white/10 bg-[#151A25] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Clear selection
              </button>

              <button
                type="button"
                disabled={!course}
                onClick={continueToStudy}
                className="rounded-xl bg-[#4169E1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3156CB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to study →
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-slate-500">
            Demo catalogue only. Course names and semester mappings are
            illustrative and must be verified against official university
            handbooks before being used as academic guidance.
          </p>
        </div>
      </section>
    </main>
  );
}
