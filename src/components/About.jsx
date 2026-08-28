import { FiUser, FiAward, FiBookOpen, FiBriefcase } from "react-icons/fi";
import { useSiteData } from "../lib/SiteDataContext";
const icons = {
  book: FiBookOpen,
  briefcase: FiBriefcase,
  award: FiAward,
  user: FiUser,
};
export default function About() {
  const { settings, stats } = useSiteData();
  return (
    <section id="about" className="py-20 px-6 section-fade gsap-section">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="gradient-text">Me</span>
          </h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full" />
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 rounded-3xl blur-2xl opacity-20" />
            <div className="relative glass rounded-3xl overflow-hidden p-2">
              <img
                src={settings.profileImage2}
                alt="About Me"
                className="rounded-2xl w-full"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4 text-orange-400">
              {settings.aboutTitle}
            </h3>
            {(Array.isArray(settings.aboutParagraphs)
              ? settings.aboutParagraphs
              : []
            ).map((p, i) => (
              <p key={i} className="text-gray-400 leading-relaxed mb-4">
                {p}
              </p>
            ))}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                ["Name", settings.name],
                ["Email", settings.email],
                ["Location", settings.location],
                ["Availability", settings.availability],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="glass rounded-xl p-4 min-w-0 overflow-hidden"
                >
                  <p className="text-gray-500 text-sm">{label}</p>
                  <p
                    className={`font-semibold min-w-0 ${label === "Availability" ? "text-green-400" : "text-white"} ${label === "Email" ? "break-all sm:break-words" : ""}`}
                  >
                    {label === "Email" ? (
                      <a
                        href={`mailto:${value}`}
                        className="hover:text-orange-400 transition-colors break-all"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => {
                const Icon = icons[s.icon] || FiAward;
                return (
                  <div
                    key={s.id || s.label}
                    className="glass rounded-xl p-4 text-center card-hover"
                  >
                    <Icon className="text-2xl text-orange-400 mx-auto mb-2" />
                    <h4 className="text-2xl font-bold gradient-text">
                      {s.value}
                    </h4>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
