import { useEffect, useState } from "react";
import { FiMenu, FiX, FiDownload } from "react-icons/fi";
import { useSiteData } from "../lib/SiteDataContext";
export default function Navbar() {
  const { settings, navLinks } = useSiteData();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  const openResume = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-resume"));
    setIsOpen(false);
  };
  return (
    <nav
      className={`gsap-navbar fixed top-0 w-full z-50 transition-all duration-300 navbar-glass ${scrolled ? "py-3" : "py-5"}`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="text-2xl font-bold gradient-text">
          &lt;Portfolio/&gt;
        </a>
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.id || link.name}
              href={link.href}
              className="text-sm text-gray-300 hover:text-orange-400 transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="/resume.pdf"
            onClick={openResume}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500 rounded-full text-white text-sm font-semibold"
          >
            <FiDownload /> Resume
          </a>
        </div>
        <button
          className="lg:hidden text-2xl text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
      {isOpen && (
        <div className="lg:hidden glass mt-3 mx-4 rounded-2xl p-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.id || link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-orange-400"
              >
                {link.name}
              </a>
            ))}
            <a
              href="/resume.pdf"
              onClick={openResume}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 rounded-full text-white font-semibold mt-2"
            >
              <FiDownload /> Download Resume
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
