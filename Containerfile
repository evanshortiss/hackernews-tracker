FROM registry.access.redhat.com/ubi8/nodejs-20-minimal

COPY package*.json .

RUN npm ci --omit dev

COPY index.mjs index.mjs

CMD ["node", "index.mjs"]