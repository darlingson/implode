package main

import (
	"context"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/darlingson/implode/frontend"
	"github.com/darlingson/implode/internal/config"
)

func main() {
	dist, err := fs.Sub(frontend.Dist, "dist")
	fs.WalkDir(dist, ".", func(p string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			slog.Info("embedded file", "path", p)
		}
		return nil
	})
	if err != nil {
		slog.Error("failed to get dist fs", "error", err)
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	if err := run(cfg, dist); err != nil {
		slog.Error("server exited with error", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped cleanly")
}

func run(cfg *config.Config, dist fs.FS) error {
	router := gin.New()
	router.Use(gin.Recovery(), requestLogger())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Anything not matching a registered route falls through to the SPA.
	router.NoRoute(spaHandler(dist))

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port, "work_dir", cfg.WorkDir)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("http server error", "error", err)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	slog.Info("shutdown signal received")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return srv.Shutdown(shutdownCtx)
}

func spaHandler(dist fs.FS) gin.HandlerFunc {
	fileServer := http.FileServer(http.FS(dist))

	return func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path != "" {
			if st, err := fs.Stat(dist, path); err == nil && !st.IsDir() {
				fileServer.ServeHTTP(c.Writer, c.Request)
				return
			}
		}

		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
	}
}

func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		slog.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(start).Round(time.Millisecond).String(),
		)
	}
}
