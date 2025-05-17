export async function generateSelfSignedCert(): Promise<{ certFile: string; keyFile: string }> {
  const dir = "/certs";
  await Deno.mkdir(dir, { recursive: true });

  const certFile = `${dir}/cert.pem`;
  const keyFile = `${dir}/key.pem`;

  const cmd = [
    "openssl",
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyFile,
    "-out",
    certFile,
    "-days",
    "365",
    "-subj",
    "/CN=localhost",
  ];

  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "null",
    stderr: "piped",
  });

  const result = await p.output();
  if (result.code !== 0) {
    const error = new TextDecoder().decode(result.stderr);
    throw new Error(`openssl failed: ${error}`);
  }

  return { certFile, keyFile };
}
