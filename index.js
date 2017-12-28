const express = require('express')
const http = require('http')
const WebSocketServer = require('ws').Server
const path = require('path')
const Session = require('./server/Session')
const Client = require('./server/Client')

const app = express()
app.use(express.static(__dirname + '/client'))

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const sessions = new Map()

function createId(len = 6, chars = 'abcdefghjkmnopqrstwxyz0123456789') {
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0]
    }
    return id
}

function createClient(conn, id = createId()) {
    return new Client(conn, id)
}

function createSession(id = createId()) {
    if (sessions.has(id)) {
        throw new Error(`Session ${id} already exists`)
    }

    const session = new Session(id)
    console.log('Creating Session', session)

    sessions.set(id, session)

    return session
}

function getSession(id) {
    return sessions.get(id)
}

function broadcastSession(session) {
    const clients = [...session.clients]
    clients.forEach(client => {
        client.send({
            type: 'session-broadcast',
            peers: {
                you: client.id,
                clients: clients.map(client => ({
                    id: client.id,
                    state: client.state
                }))
            }
        })
    })
}

wss.on('connection', conn => {
    console.log(`Connection Established`)
    const client = createClient(conn)

    conn.on('message', msg => {
        // console.log(`Message Recieved`, msg)
        const data = JSON.parse(msg)

        if (data.type === 'create-session') {
            const session = createSession()
            session.join(client)

            client.state = data.state
            client.send({
                type: 'session-created',
                id: session.id
            })
        } else if (data.type === 'join-session') {
            const session = getSession(data.id) || createSession(data.id)
            session.join(client)
            client.state = data.state

            broadcastSession(session)
        } else if (data.type === 'state-update') {
            const [prop, value] = data.state
            client.state[data.fragment][prop] = value
            client.broadcast(data)
        }
    })

    conn.on('close', () => {
        console.log(`Connection Closed`)

        const session = client.session

        if (session) {
            session.leave(client)

            if (session.clients.size === 0) {
                sessions.delete(session.id)
            }
        }

        broadcastSession(session)
    })

    conn.on('error', () => {
        console.log('Error')
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
})

server.listen(process.env.PORT || 8080, _ => {
    console.log(`Server started on port ${server.address().port}`)
})