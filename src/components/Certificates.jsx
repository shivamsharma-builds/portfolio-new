import { FiAward, FiExternalLink, FiCalendar } from "react-icons/fi";
import { useSiteData } from "../lib/SiteDataContext";
export default function Certificates() {
  const { certificates } = useSiteData();
  return (
    <section id="certificates" className="py-20 px-6 section-fade gsap-section">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            My <span className="gradient-text">Certificates</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full" />
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Continuous learning is my passion. Here are some of the
            certifications I've earned.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <div
              key={cert.id || cert.credentialId}
              className="glass rounded-2xl overflow-hidden card-hover group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={cert.image}
                  alt={cert.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                <div className="absolute top-4 left-4 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <FiAward className="text-white text-xl" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-orange-400">
                  {cert.title}
                </h3>
                <p className="text-orange-400 font-semibold mb-3">
                  {cert.issuer}
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <FiCalendar />
                  {cert.date}
                </div>
                <div className="glass rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500">Credential ID</p>
                  <p className="text-sm text-gray-300 font-mono">
                    {cert.credentialId}
                  </p>
                </div>
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 glass rounded-lg text-gray-300 hover:bg-orange-500 hover:from-orange-500 hover:to-orange-500 hover:text-white"
                >
                  <FiExternalLink /> View Certificate
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
