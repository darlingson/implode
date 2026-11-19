import { useState } from "react";
import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { FormControl } from "baseui/form-control";
import { Input } from "baseui/input";
import { Notification } from "baseui/notification";
import { Textarea } from "baseui/textarea";
import { LabelMedium, LabelXSmall } from "baseui/typography";
import { isPlausibleGitUrl, parseEnvText, type DeployRequest } from "@/mocks/deployments";

export function DeployForm({
  busy,
  onDeploy,
  inDrawer = false,
}: {
  busy: boolean;
  onDeploy: (req: DeployRequest) => void;
  inDrawer?: boolean;
}) {
  const [css, theme] = useStyletron();
  const [repoUrl, setRepoUrl] = useState("");
  const [subfolder, setSubfolder] = useState("");
  const [branch, setBranch] = useState("main");
  const [envText, setEnvText] = useState("");
  const [touched, setTouched] = useState(false);

  const urlValid = isPlausibleGitUrl(repoUrl);
  const showError = touched && !urlValid;
  const envCount = parseEnvText(envText).length;

  return (
    <form
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
      className={css({
        display: "grid",
        gap: theme.sizing.scale600,
        // When not in a drawer, give it a card treatment
        ...(!inDrawer ? {
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.borderOpaque}`,
          borderRadius: theme.borders.radius400,
          padding: theme.sizing.scale800,
        } : {}),
      })}
    >
      {/* Repo URL */}
      <FormControl
        label={
          <LabelMedium overrides={{ Block: { style: { fontWeight: "600" } } }}>
            Repository URL
          </LabelMedium>
        }
        error={showError ? "Enter an http(s) or SSH Git URL." : null}
      >
        <Input
          name="repoUrl"
          placeholder="https://github.com/acme/my-app.git"
          value={repoUrl}
          required
          autoFocus={inDrawer}
          error={showError}
          onChange={(e) => setRepoUrl(e.currentTarget.value)}
          overrides={{ Input: { style: { fontFamily: "inherit" } } }}
        />
      </FormControl>

      {/* Subfolder + Branch — side by side */}
      <div className={css({
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: theme.sizing.scale500,
      })}>
        <FormControl
          label={
            <LabelMedium overrides={{ Block: { style: { fontWeight: "600" } } }}>
              Project subfolder
            </LabelMedium>
          }
          caption="Leave empty if .csproj is at the repo root."
        >
          <Input
            name="subfolder"
            placeholder="src/MyApp"
            value={subfolder}
            onChange={(e) => setSubfolder(e.currentTarget.value)}
            overrides={{ Input: { style: { fontFamily: "inherit" } } }}
          />
        </FormControl>

        <FormControl
          label={
            <LabelMedium overrides={{ Block: { style: { fontWeight: "600" } } }}>
              Branch
            </LabelMedium>
          }
        >
          <Input
            name="branch"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.currentTarget.value)}
            overrides={{ Input: { style: { fontFamily: "inherit" } } }}
          />
        </FormControl>
      </div>

      {/* Env vars */}
      <FormControl
        label={
          <LabelMedium overrides={{ Block: { style: { fontWeight: "600" } } }}>
            Environment variables{envCount > 0 ? ` (${envCount})` : ""}
          </LabelMedium>
        }
        caption="One KEY=VALUE per line."
      >
        <Textarea
          name="envVars"
          placeholder={"ASPNETCORE_ENVIRONMENT=Production\nDATABASE_URL=…"}
          value={envText}
          rows={4}
          onChange={(e) => setEnvText(e.currentTarget.value)}
          overrides={{
            Input: { style: { fontFamily: "ui-monospace, monospace", fontSize: "13px" } },
          }}
        />
      </FormControl>

      {showError && (
        <Notification kind="negative"
          overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
        >
          Enter a valid http(s) or SSH Git URL.
        </Notification>
      )}

      {/* Submit */}
      <div className={css({ display: "flex", alignItems: "center", gap: theme.sizing.scale400 })}>
        <Button type="submit" isLoading={busy} disabled={busy}>
          Deploy
        </Button>
        <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary } } }}>
          Stubbed locally until the backend connects.
        </LabelXSmall>
      </div>
    </form>
  );
}
