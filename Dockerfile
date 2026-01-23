# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm with specific version from package.json
RUN corepack enable
RUN corepack prepare pnpm@10.18.2 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages
COPY tooling ./tooling

RUN pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm with specific version
RUN corepack enable
RUN corepack prepare pnpm@10.18.2 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/tooling ./tooling
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_CHECK 1

# Build-time public envs for Next.js (embedded into the bundle)
ARG NEXT_PUBLIC_SITE_URL=https://execgpt.com
ARG NEXT_PUBLIC_PRODUCT_NAME=ExecGPT
ARG NEXT_PUBLIC_SITE_TITLE=ExecGPT
ARG NEXT_PUBLIC_SITE_DESCRIPTION=ExecGPT
ARG NEXT_PUBLIC_DEFAULT_THEME_MODE=light
ARG NEXT_PUBLIC_THEME_COLOR=#ffffff
ARG NEXT_PUBLIC_THEME_COLOR_DARK=#0a0a0a
ARG NEXT_PUBLIC_AUTH_PASSWORD=true
ARG NEXT_PUBLIC_AUTH_MAGIC_LINK=false
ARG NEXT_PUBLIC_CAPTCHA_SITE_KEY=
ARG NEXT_PUBLIC_LOCALES_PATH=apps/web/public/locales
ARG NEXT_PUBLIC_ENABLE_THEME_TOGGLE=true
ARG NEXT_PUBLIC_LANGUAGE_PRIORITY=application
ARG NEXT_PUBLIC_ENABLE_VERSION_UPDATER=false
ARG NEXT_PUBLIC_STRAPI_URL=https://cms.execgpt.com
ARG NEXT_PUBLIC_API_URL=
ARG GIT_HASH=

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_PRODUCT_NAME=${NEXT_PUBLIC_PRODUCT_NAME}
ENV NEXT_PUBLIC_SITE_TITLE=${NEXT_PUBLIC_SITE_TITLE}
ENV NEXT_PUBLIC_SITE_DESCRIPTION=${NEXT_PUBLIC_SITE_DESCRIPTION}
ENV NEXT_PUBLIC_DEFAULT_THEME_MODE=${NEXT_PUBLIC_DEFAULT_THEME_MODE}
ENV NEXT_PUBLIC_THEME_COLOR=${NEXT_PUBLIC_THEME_COLOR}
ENV NEXT_PUBLIC_THEME_COLOR_DARK=${NEXT_PUBLIC_THEME_COLOR_DARK}
ENV NEXT_PUBLIC_AUTH_PASSWORD=${NEXT_PUBLIC_AUTH_PASSWORD}
ENV NEXT_PUBLIC_AUTH_MAGIC_LINK=${NEXT_PUBLIC_AUTH_MAGIC_LINK}
ENV NEXT_PUBLIC_CAPTCHA_SITE_KEY=${NEXT_PUBLIC_CAPTCHA_SITE_KEY}
ENV NEXT_PUBLIC_LOCALES_PATH=${NEXT_PUBLIC_LOCALES_PATH}
ENV NEXT_PUBLIC_ENABLE_THEME_TOGGLE=${NEXT_PUBLIC_ENABLE_THEME_TOGGLE}
ENV NEXT_PUBLIC_LANGUAGE_PRIORITY=${NEXT_PUBLIC_LANGUAGE_PRIORITY}
ENV NEXT_PUBLIC_ENABLE_VERSION_UPDATER=${NEXT_PUBLIC_ENABLE_VERSION_UPDATER}
ENV NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV GIT_HASH=${GIT_HASH}

# Build the web app
RUN pnpm --filter web build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ARG GIT_HASH=
ENV GIT_HASH=${GIT_HASH}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Check if public directory exists before copying
RUN if [ -d "/app/apps/web/public" ]; then \
    echo "Public directory found"; \
    else \
    echo "No public directory"; \
    fi

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]
