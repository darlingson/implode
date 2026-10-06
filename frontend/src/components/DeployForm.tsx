import { useState } from "react";
import {
  PButton,
  PHeading,
  PInlineNotification,
  PInputText,
  PInputUrl,
  PText,
  PTextarea,
} from "@porsche-design-system/components-react";
import {
  isPlausibleGitUrl,
  parseEnvText,
  type DeployRequest,
} from "@/mocks/deployments";

function readValue(e: unknown): string {
  const detail = (e as CustomEvent<{ value?: string }>).detail;
  if (typeof detail?.value === "string") return detail.value;
  const target = (e as { target?: HTMLInputElement | HTMLTextAreaElement }).target;
  return target?.value ?? "";
}

export function DeployForm({
  busy,
  onDeploy,
}: {
  busy: boolean;
  onDeploy: (req: DeployRequest) => void;
}) {
  const [repoUrl, setRepoUrl] = useState("https://github.com/example/my-dotnet-app.git");
  const [subfolder, setSubfolder] = useState("src/MyApp");
  const [branch, setBranch] = useState("main");
  const [envText, setEnvText] = useState("ASPNETCORE_ENVIRONMENT=Production\n");
  const [touched, setTouched] = useState(false);

  const urlValid = isPlausibleGitUrl(repoUrl);
  const showError = touched && !urlValid;
  const envCount = parseEnvText(envText).length;

  return (
    <form
      className="grid gap-fluid-sm rounded-3xl bg-surface p-fluid-md"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!urlValid) return;
        onDeploy({
          repoUrl: repoUrl.trim(),
          subfolder: subfolder.trim(),
          branch: branch.trim() || "main",
          envVars: parseEnvText(envText),
        });
      }}
    >
      <div>
        <PHeading size="large" tag="h2">
          Deploy a .NET repository
        </PHeading>
        <PText color="contrast-medium">
          Clone → detect → containerize → run. Stubbed end to end until the Go
          backend lands.
        </PText>
      </div>

      <PInputUrl
        name="repoUrl"
        label="Git repository URL"
        placeholder="https://github.com/acme/my-dotnet-app.git"
        value={repoUrl}
        required
        state={showError ? "error" : "none"}
        message={showError ? "Enter an http(s) or SSH Git URL." : ""}
        onInput={(e: unknown) => setRepoUrl(readValue(e))}
      />

      <div className="grid gap-fluid-sm sm:grid-cols-2">
        <PInputText
          name="subfolder"
          label="Project subfolder (optional)"
          placeholder="src/MyApp"
          value={subfolder}
          description="Relative path when the .csproj is not at the repo root."
          onInput={(e: unknown) => setSubfolder(readValue(e))}
        />
        <PInputText
          name="branch"
          label="Branch"
          placeholder="main"
          value={branch}
          onInput={(e: unknown) => setBranch(readValue(e))}
        />
      </div>

      <PTextarea
        name="envVars"
        label={`Environment variables (${envCount})`}
        placeholder={"ASPNETCORE_ENVIRONMENT=Production\nDATABASE_URL=…"}
        description="One KEY=VALUE per line. Passed as ENV + docker -e at run."
        value={envText}
        rows={4}
        onInput={(e: unknown) => setEnvText(readValue(e))}
      />

      {!urlValid && touched ? (
        <PInlineNotification heading="Check the repository URL" state="error">
          Stub validation only accepts http(s) or SSH Git URLs.
        </PInlineNotification>
      ) : null}

      <div className="flex flex-wrap items-center gap-static-sm">
        <PButton type="submit" loading={busy} disabled={busy} icon="arrow-right">
          {busy ? "Deploying…" : "Deploy"}
        </PButton>
        <PText color="contrast-medium" size="x-small">
          Backend stub: pipeline is simulated locally.
        </PText>
      </div>
    </form>
  );
}
