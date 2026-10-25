// Health check for Railway. It does not touch the database, so a deploy is
// marked healthy as soon as the web server is up.
export function GET() {
  return Response.json({ ok: true });
}
