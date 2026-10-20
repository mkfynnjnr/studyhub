
"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const courses = [
  {
    code: "CS 101",
    title: "Introduction to Computer Science",
    school: "University of Ghana",
    category: "Technology",
    icon: "⌘",
  },
  {
    code: "MATH 101",
    title: "Algebra & Calculus",
    school: "KNUST",
    category: "Mathematics",
    icon: "∑",
  },
  {
    code: "BUS 101",
    title: "Principles of Management",
    school: "University of Ghana",
    category: "Business",
    icon: "↗",
  },
];

const features = [
  {
    icon: "✳",
    title: "AI Study Assistant",
    description:
      "Get clear explanations, understand difficult concepts, and ask questions whenever you need help.",
  },
  {
    icon: "▤",
    title: "Smart Notes",
    description:
      "Turn study materials into organized notes, summaries, and revision guides.",
  },
  {
    icon: "✓",
    title: "Practice & Improve",
    description:
      "Test your understanding with practice questions and learn from your mistakes.",
  },
];

const categories = ["All", "Technology", "Mathematics", "Business"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesSearch = [
          course.title,
          course.code,
          course.school,
          course.category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

        return (
          matchesSearch &&
          (activeTab === "All" || course.category === activeTab)
        );
      }),
    [search, activeTab]
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#090B10] text-[#F1F5F9]">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#090B10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4169E1] text-xl font-bold text-white shadow-lg shadow-blue-950/50">
              S
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Study<span className="text-[#4169E1]">Hub</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-[#8EAFFF]">
              Features
            </a>
            <a href="/courses" className="transition hover:text-[#8EAFFF]">
              Explore courses
            </a>
            
            <a
              href="/study"
              className="transition hover:text-[#8EAFFF]"
            >
              Study
            </a>

            
            <a href="#about" className="transition hover:text-[#8EAFFF]">
              About us
            </a>
          </nav>

          <a
            href="/courses"
            className="rounded-xl bg-[#4169E1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3156CB]"
          >
            Get started <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute -right-40 -top-32 -z-10 h-96 w-96 rounded-full bg-[#2448B8]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-48 -z-10 h-80 w-80 rounded-full bg-[#4169E1]/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#4169E1]/30 bg-[#151A25] px-4 py-2 text-sm font-medium text-[#AFC4FF]">
              <span className="h-2 w-2 rounded-full bg-[#4169E1]" />
              Built for the next generation of African students
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Study smarter.
              <br />
              <span className="text-[#4169E1]">Achieve more.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              Your personal learning hub. Explore courses, understand
              complex topics, create study notes, and prepare for exams
              with AI-powered learning tools.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/courses"
                className="rounded-xl bg-[#4169E1] px-6 py-3.5 font-semibold text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:bg-[#3156CB]"
              >
                Explore courses <span aria-hidden="true">→</span>
              </a>
              <a
                href="#features"
                className="rounded-xl border border-white/15 bg-[#151A25] px-6 py-3.5 font-semibold text-slate-200 transition hover:border-[#4169E1]/60 hover:bg-[#1B2333]"
              >
                Discover StudyHub
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span>✓ Learn at your own pace</span>
              <span>✓ Student-focused</span>
              <span>✓ Start exploring for free</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#2448B8]/15 blur-2xl" />

            <div className="relative rounded-3xl border border-white/10 bg-[#10141D] p-5 shadow-2xl shadow-black/50 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm tracking-wider text-slate-500">
                    YOUR LEARNING SPACE
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Welcome to StudyHub
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#4169E1]/20 bg-[#4169E1]/15 text-xl text-[#8EAFFF]">
                  ✳
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.06] bg-[#151A25] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4169E1] text-lg text-white">
                    ✦
                  </div>
                  <div>
                    <p className="font-semibold">AI Study Assistant</p>
                    <p className="text-xs text-slate-400">
                      Your learning companion
                    </p>
                  </div>
                  <span className="ml-auto rounded-full border border-[#4169E1]/30 bg-[#4169E1]/10 px-2.5 py-1 text-xs font-semibold text-[#AFC4FF]">
                    Preview
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#0D1119] p-4">
                  <p className="text-sm leading-6 text-slate-400">
                    Need help understanding a topic? StudyHub is being
                    designed to break difficult concepts into simple,
                    manageable explanations.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.08] bg-[#151A25] p-4">
                  <span className="text-2xl text-[#8EAFFF]">▤</span>
                  <p className="mt-3 font-semibold">Study notes</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Organize what you learn
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#151A25] p-4">
                  <span className="text-2xl text-[#8EAFFF]">✓</span>
                  <p className="mt-3 font-semibold">Practice tests</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Prepare with confidence
                  </p>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-slate-500">
                A preview of the StudyHub learning experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regional focus */}
      <section className="border-y border-white/[0.08] bg-[#0D1119]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8">
          {[
            {
              icon: "🇬🇭",
              title: "Starting in Ghana",
              description: "Made with local students in mind",
            },
            {
              icon: "🇳🇬",
              title: "Expanding to Nigeria",
              description: "More institutions over time",
            },
            {
              icon: "🌍",
              title: "Built for Africa",
              description: "A wider learning community",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#151A25] text-2xl">
                {item.icon}
              </span>
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8EAFFF]">
            Everything in one place
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            A better way to learn
          </h2>
          <p className="mt-4 leading-7 text-slate-400">
            Less time feeling stuck. More time understanding your
            courses and preparing for your goals.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-white/[0.08] bg-[#10141D] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#4169E1]/50 hover:shadow-xl hover:shadow-blue-950/20"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4169E1]/20 bg-[#4169E1]/10 text-2xl text-[#8EAFFF]">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
              <p className="mt-5 text-sm font-semibold text-[#8EAFFF]">
                Coming to StudyHub <span aria-hidden="true">→</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Course catalogue */}
      <section
        id="courses"
        className="border-y border-white/[0.08] bg-[#0D1119]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8EAFFF]">
                Find your next topic
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Explore courses
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-400">
                Discover the subjects you want to understand. This initial
                catalogue is a prototype, not a verified course directory.
              </p>
            </div>
            <span className="w-fit rounded-full border border-[#4169E1]/30 bg-[#4169E1]/10 px-4 py-2 text-sm font-medium text-[#AFC4FF]">
              Sample courses
            </span>
          </div>

          <div className="mt-9">
            <label htmlFor="course-search" className="sr-only">
              Search courses
            </label>
            <div className="flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-[#151A25] px-4 py-3 transition focus-within:border-[#4169E1] focus-within:ring-4 focus-within:ring-[#4169E1]/10">
              <span className="text-xl text-slate-500" aria-hidden="true">
                ⌕
              </span>
              <input
                id="course-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses, subjects, or universities..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-[#4169E1] text-white shadow-lg shadow-blue-950/30"
                    : "border border-white/10 bg-[#151A25] text-slate-400 hover:border-[#4169E1]/50 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course.code}
                className="rounded-2xl border border-white/[0.08] bg-[#10141D] p-6 transition hover:border-[#4169E1]/50 hover:shadow-lg hover:shadow-blue-950/20"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#4169E1]/20 bg-[#4169E1]/10 text-2xl text-[#8EAFFF]">
                    {course.icon}
                  </span>
                  <span className="rounded-lg border border-white/[0.08] bg-[#151A25] px-3 py-1.5 text-xs font-semibold text-slate-300">
                    {course.code}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{course.school}</p>
                <div className="mt-5 border-t border-white/[0.08] pt-4">
                  <span className="text-sm font-medium text-[#8EAFFF]">
                    Sample course
                  </span>
                </div>
              </article>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-[#10141D] p-10 text-center">
              <p className="font-semibold">No matching courses yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Try another search or choose a different category.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTab("All");
                }}
                className="mt-4 font-semibold text-[#8EAFFF] hover:text-white"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to action */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#4169E1]/20 bg-[#101522] px-7 py-12 sm:px-12 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-16 -top-32 -z-10 h-80 w-80 rounded-full bg-[#4169E1]/20 blur-3xl" />
          <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8EAFFF]">
                Your learning journey starts here
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                Your goals. Your courses. Your StudyHub.
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                We're building a more accessible way for students in
                Ghana, Nigeria, and across Africa to learn and grow.
              </p>
            </div>
            <a
              href="/courses"
              className="w-fit rounded-xl bg-[#4169E1] px-6 py-3.5 font-semibold text-white transition hover:bg-[#3156CB]"
            >
              Start exploring →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07090D]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <a href="#" className="text-lg font-extrabold text-[#F1F5F9]">
            Study<span className="text-[#4169E1]">Hub</span>
          </a>
          <p>Built for students. Designed for discovery.</p>
          <p>© 2026 StudyHub</p>
        </div>
      </footer>
    </main>
  );
}
