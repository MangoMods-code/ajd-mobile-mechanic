# This is the "program" Railway runs: Caddy, a tiny, fast web server that
# simply hands your site's files to visitors. Railway auto-detects this file.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv
