var http = require("http")
var fs = require("fs")
var url = require("url")
var port = process.argv[2]

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？")
  process.exit(1)
}
let sessions={

}

var server = http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ""
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"))
  }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log("含查询字符串的路径\n" + pathWithQuery)
  if (path==='/js/main.js') {
    let string =fs.readFileSync('./js/main.js','utf8')
    response.setHeader('Content-Type','application/javascript;charset=uft8')
    response.setHeader('Cache-Control','max-age=30')
    response.write(string)
    response.end()
  }else if (path==='/css/default.css') {
    let string =fs.readFileSync('./css/default.css','utf8')
    response.setHeader('Content-Type','text/css;charset=uft8')
    response.setHeader('Cache-Control','max-age=30')
    response.write(string)
    response.end()
  }else if (path === "/") {
    let string = fs.readFileSync("./index.html", "utf-8")
    console.log('request.headers.cookie')
    console.log(request.headers.cookie)
    let cookies=''
    if (request.headers.cookie) {
      cookies=request.headers.cookie.split('; ')
    }
    //得到一个有三个字符串的数组 ['enail=1@','a=1','b=2']
    let hash ={}
    for (let i = 0; i < cookies.length; i++) {
      let parts = cookies[i].split('=');
      let key =parts[0]
      let value =parts[1]
      hash[key]=value
    }
    console.log(hash)
    let mySession =sessions[hash.sessionsId]//这个hash.sessionsId是一个随机数
    let email
    if (mySession) {
      email=mySession.sign_in_email
    }
    let users =fs.readFileSync('./db/users','utf8')
    try {
      users=JSON.parse(users)
    } catch (exception) {
      users=[]
    }
    let foundUser
    for (let i = 0; i < users.length; i++) {
      if (users[i].email===email) {
        foundUser =users[i] //数组里面存的对象
        break
      }
    }
    if (foundUser) {
      string=string.replace('__password__',foundUser.password)
    }else {
      string= string.replace('__password__','不知道')
    }
    response.statusCode = 200
    response.setHeader("Content-Type", "text/html;charset=utf-8")
    response.write(string)
    response.end()
  }else if (path==='/sign_up'&&method==='GET') {
    let string = fs.readFileSync('./sign_up.html','utf-8')
    response.statusCode=200
    response.setHeader('Content-Type','text/html; charset=utf-8')
    response.write(string)
    response.end()  //这是一个路由
  }else if (path==='/sign_up'&&method==='POST') {
      readBody(request).then((body)=>{
        let strings=body.split('&')//返回一个数组
        let hash={}
        strings.forEach((string)=>{
          let parts=string.split('=')
          let key=parts[0]
          let value = parts[1]
          hash[key]=decodeURIComponent(value)  //hash['email']='1'
        })
        let {email,password,password_confirmation}=hash
        if (email.indexOf('@')===-1) {
          response.statusCode=400
          response.setHeader("Content-Type", "application/json;charset=utf-8")
          response.write(`
          {
            "errors":{
              "email":"invalid"
            }
          }`)
        }else if (password!==password_confirmation) {
          response.statusCode=400
          response.write('password not match')
        }else {
          let users =fs.readFileSync('./db/users','utf8')
          try {
            users=JSON.parse(users)
          } catch (exception) {
            users=[]
          }
          let inUse=false
          for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user.email===email) {
              inUse=true
              break;
            }
          }
          if (inUse) {
            response.statusCode=400
            response.write('email in use')
          }else {
            users.push({email:email,password:password})
            let usersString = JSON.stringify(users)
            console.log(usersString)
            fs.writeFileSync('./db/users',usersString)
            response.statusCode=200
          }
        }
        response.end() 
      })
  } else if (path==='/sign_in'&&method==='GET') {
    let string = fs.readFileSync('./sign_in.html','utf-8')
    response.statusCode=200
    response.setHeader('Content-Type','text/html; charset=utf-8')
    response.write(string)
    response.end()  //这是一个路由
  } else if (path==='/sign_in'&&method==='POST') {//登录
    readBody(request).then((body)=>{
      let strings=body.split('&')//返回一个数组
      let hash={}
      strings.forEach((string)=>{
        let parts=string.split('=')
        let key=parts[0]
        let value = parts[1]
        hash[key]=decodeURIComponent(value)  //hash['email']='1'
      })
      let {email,password}=hash
      console.log('email')
      console.log(email)
      console.log('password')
      console.log(password)
      let users =fs.readFileSync('./db/users','utf8')//users是一个数组，数组里面存的是一个一个的对象
          try {
            users=JSON.parse(users)
          } catch (exception) {
            users=[]
          }
        let found
        for (let i = 0; i < users.length; i++) {
          if (users[i].eamil===email||users[i].password===password) {
            found=true
            break
          }
        }
        if (found) {
          let sessionsId =Math.random()*100000
          sessions[sessionsId]={sign_in_email:email}
          response.setHeader('Set-Cookie', `sessionsId=${sessionsId}`)
          response.statusCode=200
        }else {
          response.statusCode=401
        }
        response.end()
      })
  } else if (path === "/main.js") {
    let string = fs.readFileSync("./main.js", "utf-8")
    response.statusCode = 200
    response.setHeader("Content-Type", "text/javascript;charset=utf-8")
    response.write(string)
    response.end()
  } else if (path === "/xxx") {
    response.statusCode = 200
    response.setHeader("Content-Type", "text/json;charset=utf-8")
    response.setHeader("Access-Control-Allow-Origin", "http://frank.com:8001")
    response.write(`
    {
      "note":{
        "note":"小谷",
        "from":"方方",
        "heading":"打招呼",
        "content":"hi"
      }
    }
      `)
    response.end()
  } else {
    response.statusCode = 404
    response.setHeader("Content-Type", "text/html;charset=utf-8")
    response.write(`
    {
      "error":"not found"
    }
    `)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
)



function readBody(request) {
  return new Promise((reslove,reject)=>{
    let body=[]
    request.on('data',(chunk)=>{
      body.push(chunk)
    }).on('end',()=>{
      body=Buffer.concat(body).toString()
      reslove(body)
    })
  })
}