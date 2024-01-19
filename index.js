const yaml = require('js-yaml')
const _ = require("lodash")
const fs = require("fs-extra")
const { spawn } = require('child_process');

const eventV1Str = fs.readFileSync("aws_events/event-v1.json", { encoding: "utf-8" })
const eventV1 = JSON.parse(eventV1Str)
// Get document, or throw exception on error
function loadYaml(path) {
  try {
    const doc = yaml.load(fs.readFileSync(path, 'utf8'));
    return doc
  } catch (e) {
    throw new Error(`can not find or load file: ${path}`)
  }
}

function generateTruuthContext(roles = ["ADMIN"], tenant = "acme") {
  const obj = {
    "identity": {
      "tenant": tenant,
      "principalId": "1234",
      "roles": roles
    }
  }

  return Buffer.from(JSON.stringify(obj)).toString('base64')
}

function generateHttpJsonForEvent(event) {
  // console.log(event?.request?.parameters?.paths)
  const result = {}
  result.path = event.path
  result.httpMethod = String(event.method).toUpperCase()
  result.pathParameters = {}
  result.headers = {
    "x-truuth-context": generateTruuthContext()
  }

  const pathParams = event?.request?.parameters?.paths
  if (pathParams) {
    Object.keys(pathParams).forEach(p => {
      result.pathParameters[p] = null
    })
  }


  return _.defaults(result, eventV1)
}

function generate(version = 'v1') {
  const serverlessDoc = loadYaml('./serverless.yml')
  const functions = serverlessDoc?.functions
  Object.entries(functions).forEach(async ([key, val]) => {
    await fs.ensureDir(`events/${key}`)
    val?.events.forEach(ev => {
      // handle http event for now
      if (!ev?.http) return
      const res = generateHttpJsonForEvent(ev.http)
      const eventFileName = `${ev.http.method}-${String(ev.http.path).replace(/[{}]/g, '').replace(/\//g, '-')}.json`
      fs.writeFileSync(`events/${key}/${eventFileName.replace(/-+/g, '-')}`, JSON.stringify(res))
    })
  })
}

// function execute() {
//   const child = spawn('serverless', ['invoke', 'local', '--function', 'http-handler']);

//   // use child.stdout.setEncoding('utf8'); if you want text chunks
//   child.stdout.setEncoding('utf8')
//   child.stderr.setEncoding('utf8')
//   child.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
//   });

//   child.stderr.on('data', (data) => {
//     console.log(`stderr: ${data}`);
//   });

//   child.on('close', (code) => {
//     console.log(`child process exited with code ${code}`);
//   });
// }

generate()