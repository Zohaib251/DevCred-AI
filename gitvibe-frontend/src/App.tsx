import { useState } from "react";
import { Upload, Zap } from "lucide-react";

export default function App() {
  // The 'useState' hooks are the foundation of this component's interactivity.
// Each one tracks a piece of the UI's state, and updating them will
// trigger React to re-render the component with the new values.

// Tracks the resume file selected by the user from their local machine.
// It's null by default and gets updated when a file is chosen.
const [resumeFile, setResumeFile] = useState<File | null>(null);

// Holds the GitHub username input by the user. This is an optional
// field used for project validation.
const [githubUsername, setGithubUsername] = useState<string>("");

// A boolean flag to manage the loading state of the API call. When true,
// the UI will show a loading spinner and disable the "Analyze" button
// to prevent multiple submissions.
const [isLoading, setIsLoading] = useState<boolean>(false);

// Stores the JSON response from the backend API after a successful analysis.
// It's null initially, and when it's populated, the UI conditionally
// renders the results in data cards.
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
      // The native web 'FormData' API is used to construct a payload suitable
      // for file uploads. We append the resume file under the key "file", which
      // the backend server expects to find in the multipart/form-data request.
      const formData = new FormData();
      formData.append("file", resumeFile);

      // Dynamically construct the API endpoint. If a GitHub username is provided,
      // it's appended as a query parameter. This allows the backend to decide
      // whether to perform the GitHub validation step.
      const endpoint = githubUsername
        ? `https://devcred-backend-wvpm.onrender.com/api/v1/resume/parse?github_username=${encodeURIComponent(githubUsername)}`
        : "https://devcred-backend-wvpm.onrender.com/api/v1/resume/parse";

      // The 'fetch' pipeline sends the asynchronous POST request to the backend.
      // The 'body' of the request is our 'formData' object, which contains the
      // binary data of the resume file. The browser handles the complex details
      // of streaming this data across the local port to the server.
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // Once the analysis is complete, the backend sends back a JSON response,
      // which we parse and then store in our component's state, triggering a re-render
      // to display the new data.
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
    <div className="min-h-screen bg-slate-950">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-950 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DevCred AI
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Authenticate your resume and validate your GitHub projects in real-time
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Profile Assessment Form */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 sticky top-32">
              {/* Form Header */}
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Profile Assessment
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Upload your resume and validate projects
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  Resume File
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-8 transition hover:border-blue-500 hover:bg-slate-900/50">
                  <Upload className="w-6 h-6 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-200">
                    Click to upload
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
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
                <label className="block text-sm font-semibold text-slate-200">
                  GitHub Username
                </label>
                <div className="flex items-center gap-3 rounded-lg bg-slate-950 border border-slate-800 px-4 py-3 transition focus-within:border-blue-500">
                  <svg
                    className="w-4 h-4 text-slate-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g., torvalds"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Leave empty to skip GitHub validation
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!resumeFile || isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
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
            </div>
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-8">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Candidate Card */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Candidate Information
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {analysisResult.analysis.candidate_name}
                      </p>
                      {analysisResult.github_validation?.status === "success" && (
                        <p className="text-sm text-slate-400 mt-2">
                          {analysisResult.github_validation.repositories_found} GitHub repositories found
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Card */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis.detected_skills.length > 0 ? (
                      analysisResult.analysis.detected_skills.map(
                        (skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800/60 text-xs font-medium text-slate-200 hover:border-blue-500/50 transition"
                          >
                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">No skills detected</p>
                    )}
                  </div>
                </div>

                {/* Projects Card */}
                {analysisResult.analysis.extracted_projects.length > 0 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Validated Projects
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.analysis.extracted_projects.map(
                        (project: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
                          >
                            {/* Project Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-sm">
                                  {project.project_name}
                                </h4>
                              </div>
                              {/* Status Badge */}
                              <span
                                className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                  project.verification_status === "Verified"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : project.verification_status === "Tutorial Clone"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                                }`}
                              >
                                {project.verification_status}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {project.resume_description}
                            </p>

                            {/* GitHub Repo Link */}
                            {project.matching_github_repo && (
                              <div className="pt-2 border-t border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">Matched Repository:</p>
                                <a
                                  href={`https://github.com/search?q=${encodeURIComponent(project.matching_github_repo)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-mono text-blue-400 hover:text-blue-300 transition"
                                >
                                  {project.matching_github_repo}
                                </a>
                              </div>
                            )}

                            {/* Confidence Reasoning */}
                            <div className="pt-2 border-t border-slate-800">
                              <p className="text-xs text-slate-500 italic">
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
                  <div className="rounded-2xl bg-slate-900 border border-green-900/50 p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <p className="text-sm text-green-300">
                        GitHub validation active:{" "}
                        <strong>@{analysisResult.github_validation.username}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">
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
