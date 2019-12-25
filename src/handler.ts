class UserAgent {
  product: string
  version: string
  comment: string
  raw: string

  constructor(raw: string) {
    this.product = ''
    this.version = ''
    this.comment = ''
    this.raw = raw

    let parts = raw.split('/', 2)
    if (parts.length > 1) {
      // First character is a number, treat it as version
      if (parts[1].length > 0 && +parts[1][0] > 48 && +parts[1][0] <= 57) {
        let rest = parts[1].split(' ', 2)
        this.version = rest[0]
        if (rest.length > 1) {
          this.comment = rest[1]
        }
      }
    } else {
      parts = raw.split(' ', 2)
      if (parts.length > 1) {
        this.comment = parts[1]
      }
    }
    this.product = parts[0]
  }
}

class IPInfo {
  ip: string = ''
  continent: string = ''
  country: string = ''
  city: string = ''
  latitude: number = 0
  longitude: number = 0
}

function getIPInfo(request: Request): IPInfo {
  // https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
  let clientIP = request.headers.get('CF-Connecting-IP')
  let xffHeader = request.headers.get('X-Forwarded-For')
  if (xffHeader) {
    let i = xffHeader.indexOf(',')
    if (i != -1) {
      clientIP = xffHeader.substring(0, i)
    }
  }

  let info = new IPInfo()
  if (clientIP) {
    info.ip = clientIP
  }
  if (request.cf) {
    info.continent = request.cf.continent
    info.country = request.cf.country
    info.city = request.cf.city
    info.latitude = request.cf.latitude
    info.longitude = request.cf.longitude
  }
  return info
}

export async function handleRequest(request: Request): Promise<Response> {
  let cliRequest = false
  let uaHeader = request.headers.get('User-Agent')
  if (uaHeader != null) {
    let ua = new UserAgent(uaHeader)
    switch (ua.product) {
      case 'curl':
      case 'Wget':
        cliRequest = true
        break
      default:
        break
    }
  }

  if (
    request.headers.get('Accept') == 'application/json' ||
    request.url.indexOf('json') != -1
  ) {
    return jsonHandler(request)
  } else if (cliRequest) {
    return cliHandler(request)
  } else {
    return htmlHandler(request)
  }
}

async function cliHandler(request: Request): Promise<Response> {
  let info = getIPInfo(request)
  const init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  }
  return new Response(`${info.ip}`, init)
}

async function jsonHandler(request: Request): Promise<Response> {
  let info = getIPInfo(request)
  const init = {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }
  return new Response(JSON.stringify(info), init)
}

async function htmlHandler(request: Request): Promise<Response> {
  let host = request.headers.get('Host')
  let info = getIPInfo(request)
  if (host == null) {
    host = 'UNKNOWN'
  }
  let html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>What is my IP address? &mdash; ${host}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pure/1.0.0/pure-min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pure/1.0.0/grids-responsive-min.css">
    <style>
        html,
        .pure-g [class *="pure-u"] {
            background-color: white;
            font-family: "Open Sans", sans-serif;
        }

        pre {
            font-family: "Monaco", "Menlo", "Consolas", "Courier New", monospace;
            white-space: pre-wrap;
            /* Since CSS 2.1 */
            white-space: -moz-pre-wrap;
            /* Mozilla, since 1999 */
            white-space: -pre-wrap;
            /* Opera 4-6 */
            white-space: -o-pre-wrap;
            /* Opera 7 */
            word-wrap: break-word;
        }

        body {
            margin-left: auto;
            margin-right: auto;
            max-width: 80%;
            margin-bottom: 10px;
        }

        a {
            background: #e3e3e3;
            text-decoration: none;
            color: #000;
        }

        a:hover,
        active {
            background: #d7d7d7;
        }

        .ip {
            border: 1px solid #cbcbcb;
            background: #f2f2f2;
            font-size: 36px;
            padding: 6px;
        }
    </style>
</head>

<body>
    <div class="pure-g">
        <div class="pure-u-1-1">
            <h1>What is my IP address?</h1>
            <p><code class="ip">${info.ip}</code></p>
            <p>Multiple command line HTTP clients are supported,
                including <a href="https://curl.haxx.se/">curl</a>, <a href="https://www.gnu.org/software/wget/">GNU
                    Wget</a>.</p>
        </div>
    </div>
    <div class="pure-g">
        <div class="pure-u-1 pure-u-md-1-2">
            <h2>CLI examples</h2>
            <pre>
$ curl ${host}
${info.ip}

$ wget -qO- ${host}
${info.ip}</pre>
        </div>
        <div class="pure-u-1 pure-u-md-1-2">
            <h2>JSON output</h2>
            <pre>
$ curl ${host}/json
${JSON.stringify(info, null, 1)}</pre>
            <p>Setting the <code>Accept: application/json</code> header also works as expected.</p>
        </div>
    </div>
</body>

</html>`

  const init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  }

  return new Response(html, init)
}
