import { useState } from "react";

// SVGs for the new icon system, replacing Lucide icons.
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M7 2v11h3v9l7-12h-4l4-8H7z" />
  </svg>
);

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
  </svg>
);

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);


export default function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      alert("Please select a resume file");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const endpoint = githubUsername
        ? `https://devcred-backend-wvpm.onrender.com/api/v1/resume/parse?github_username=${encodeURIComponent(githubUsername)}`
        : "https://devcred-backend-wvpm.onrender.com/api/v1/resume/parse";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header Banner */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <ZapIcon className="w-6 h-6 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">
              DevCred AI
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Authenticate your resume and validate your GitHub projects in real-time
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Profile Assessment Form */}
          <div className="lg:col-span-4">
            <div className="border border-gray-200 bg-white p-6 space-y-6 sticky top-32">
              {/* Form Header */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile Assessment
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Upload your resume and validate projects
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Resume File
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 transition hover:border-gray-400">
                  <UploadIcon className="w-6 h-6 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-800">
                    Click to upload
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {resumeFile ? resumeFile.name : "PDF or DOCX"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* GitHub Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  GitHub Username
                </label>
                <div className="flex items-center gap-3 rounded-md bg-white border border-gray-200 px-4 py-3 transition focus-within:border-gray-900">
                  <GitHubIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g., torvalds"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leave empty to skip GitHub validation
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!resumeFile || isLoading}
                className="w-full rounded-md bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Resume"
                )}
              </button>

              {/* Developer Watermark */}
              <div className="pt-6 border-t border-gray-100 text-center">
                <a
                  href="https://github.com/Zohaib251"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-gray-400 hover:text-gray-900 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 inline-block mr-1.5 fill-current align-middle" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  DevCred Authored by Zohaib Ali
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-8">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Candidate Card */}
                <div className="border border-gray-200 bg-white p-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Candidate Information
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {analysisResult.analysis.candidate_name}
                      </p>
                      {analysisResult.github_validation?.status === "success" && (
                        <p className="text-sm text-gray-500 mt-2">
                          {analysisResult.github_validation.repositories_found} GitHub repositories found
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Card */}
                <div className="border border-gray-200 bg-white p-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis.detected_skills.length > 0 ? (
                      analysisResult.analysis.detected_skills.map(
                        (skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 rounded-md border border-gray-200 text-xs font-medium text-gray-700"
                          >
                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-sm text-gray-500">No skills detected</p>
                    )}
                  </div>
                </div>

                {/* Projects Card */}
                {analysisResult.analysis.extracted_projects.length > 0 && (
                  <div className="border border-gray-200 bg-white p-6 space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Validated Projects
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.analysis.extracted_projects.map(
                        (project: any, idx: number) => (
                          <div
                            key={idx}
                            className="border border-gray-200 p-4 space-y-3"
                          >
                            {/* Project Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {project.project_name}
                                </h4>
                              </div>
                              {/* Status Badge */}
                              <span
                                className={`flex-shrink-0 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                                  project.verification_status === "Verified"
                                    ? "bg-gray-900 text-white"
                                    : project.verification_status === "Tutorial Clone"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {project.verification_status}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {project.resume_description}
                            </p>

                            {/* GitHub Repo Link */}
                            {project.matching_github_repo && (
                              <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Matched Repository:</p>
                                <a
                                  href={`https://github.com/search?q=${encodeURIComponent(project.matching_github_repo)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-mono text-gray-800 hover:underline"
                                >
                                  {project.matching_github_repo}
                                </a>
                              </div>
                            )}

                            {/* Confidence Reasoning */}
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 italic">
                                {project.confidence_reasoning}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* GitHub Validation Banner */}
                {analysisResult.github_validation?.status === "success" && (
                  <div className="border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-900 rounded-full" />
                      <p className="text-sm text-gray-700">
                        GitHub validation active:{" "}
                        <strong className="font-semibold">@{analysisResult.github_validation.username}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 bg-white p-12 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <ZapIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Upload a resume to see analysis results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
