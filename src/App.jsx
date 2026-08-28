import { Component, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Education from "./components/Education";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certificates from "./components/Certificates";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ResumeModal from "./components/ResumeModal";
import AdminApp from "./admin/AdminApp";
import { SiteDataProvider, useSiteData } from "./lib/SiteDataContext";

class PublicErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error("Portfolio render error:", error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-6 text-white">
        <div className="max-w-lg rounded-2xl border border-red-500/20 bg-white/5 p-6 text-center">
          <h1 className="text-xl font-bold">Content could not be displayed</h1>
          <p className="mt-2 text-sm text-gray-400">
            The database contains content that this section cannot render yet.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-3 font-semibold"
          >
            Reload site
          </button>
        </div>
      </div>
    );
  }
}

function PortfolioApp() {
  const {
    data,
    loading: dataLoading,
    error: dataError,
    refresh,
  } = useSiteData();
  const [resumeOpen, setResumeOpen] = useState(false);
  const loading = dataLoading || !data;
  useEffect(() => {
    const openResume = () => setResumeOpen(true);
    window.addEventListener("open-resume", openResume);
    return () => window.removeEventListener("open-resume", openResume);
  }, []);
  useEffect(() => {
    if (loading) return undefined;
    let cancelled = false,
      cleanup = () => {};
    const setup = async () => {
      try {
        const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
          await Promise.all([
            import("lenis"),
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({
          duration: 1.15,
          smoothWheel: true,
          syncTouch: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.1,
        });
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        const raf = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        const ctx = gsap.context(() => {
          gsap.utils
            .toArray(".gsap-section")
            .forEach((section) =>
              gsap.fromTo(
                section,
                { y: 35, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.7,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: section,
                    start: "top 88%",
                    toggleActions: "play none none reverse",
                  },
                },
              ),
            );
          gsap.utils
            .toArray(".experience-card,.education-card")
            .forEach((card, index) =>
              gsap.fromTo(
                card,
                { opacity: 0, x: index % 2 === 0 ? -45 : 45 },
                {
                  opacity: 1,
                  x: 0,
                  duration: 0.7,
                  delay: index * 0.08,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: card,
                    start: "top 86%",
                    toggleActions: "play none none reverse",
                  },
                },
              ),
            );
          gsap.fromTo(
            ".gsap-navbar",
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
          );
        });
        ScrollTrigger.refresh();
        cleanup = () => {
          ctx.revert();
          lenis.off("scroll", onScroll);
          gsap.ticker.remove(raf);
          lenis.destroy();
        };
      } catch (error) {
        console.warn("Optional animation layer failed:", error);
      }
    };
    setup();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [loading]);
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-bold text-white">
            Loading latest portfolio content...
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Fetching the current data from the database.
          </p>
        </div>
      </div>
    );
  if (dataError)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-6 text-white">
        <div className="max-w-lg rounded-2xl border border-orange-500/20 bg-white/5 p-6 text-center">
          <h1 className="text-xl font-bold">Unable to load portfolio</h1>
          <p className="mt-2 break-words text-sm text-gray-400">{dataError}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0f]">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Education />
      <Experience />
      <Projects />
      <Certificates />
      <Contact />
      <Footer />
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </div>
  );
}
export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? (
    <AdminApp />
  ) : (
    <SiteDataProvider>
      <PublicErrorBoundary>
        <PortfolioApp />
      </PublicErrorBoundary>
    </SiteDataProvider>
  );
}
