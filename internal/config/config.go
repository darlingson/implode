package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port           string
	WorkDir        string
	DockerRegistry string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		WorkDir:        getEnv("WORK_DIR", "./workspace"),
		DockerRegistry: os.Getenv("DOCKER_REGISTRY"),
	}

	if err := os.MkdirAll(cfg.WorkDir, 0o755); err != nil {
		return nil, fmt.Errorf("creating work dir %q: %w", cfg.WorkDir, err)
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}