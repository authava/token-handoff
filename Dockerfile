FROM denoland/deno:2.3.3

USER root
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /certs && chown deno:deno /certs

USER deno

WORKDIR /app
COPY . .

EXPOSE 3000

CMD ["run", "--allow-env", "--allow-net", "--allow-read=/certs", "--allow-write", "--allow-run", "src/server.ts"]
