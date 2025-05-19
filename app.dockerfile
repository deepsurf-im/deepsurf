FROM node:20.18.0-slim AS builder

WORKDIR /root/Deepsurf.ai

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY tsconfig.json next.config.mjs next-env.d.ts postcss.config.js tailwind.config.ts ./
COPY src ./src
COPY public ./public

RUN mkdir -p /root/Deepsurf.ai/data
RUN yarn build

FROM node:20.18.0-slim

WORKDIR /root/Deepsurf.ai

COPY --from=builder /root/Deepsurf.ai/public ./public
COPY --from=builder /root/Deepsurf.ai/.next/static ./public/_next/static

COPY --from=builder /root/Deepsurf.ai/.next/standalone ./
COPY --from=builder /root/Deepsurf.ai/data ./data

RUN mkdir /root/Deepsurf.ai/uploads

CMD ["node", "server.js"]