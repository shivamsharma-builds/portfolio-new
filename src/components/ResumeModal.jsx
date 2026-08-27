import { FiDownload, FiX } from 'react-icons/fi'

const ResumeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 resume-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Resume preview"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="resume-modal-panel glass-strong w-full max-w-5xl h-[88vh] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Resume Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review your resume before downloading.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/resume.pdf"
              download
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:scale-[1.03] transition-transform"
            >
              <FiDownload /> Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume preview"
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950/80">
          <iframe
            src="/resume.pdf"
            title="Resume"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  )
}

export default ResumeModal
