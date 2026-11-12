# 1. Lightweight Node.js base image (~130MB instead of ~1GB)
FROM node:22-alpine

# 2. Container ke andar working directory set karna
WORKDIR /app

# 3. Pehle sirf package.json & package-lock.json copy karna (Docker layer caching ke liye)
COPY package*.json ./

# 4. Sirf production packages install + npm cache clean karna (chhota image size)
RUN npm install --omit=dev && npm cache clean --force

# 5. Baaki project code copy karna (.dockerignore node_modules aur .env ko skip karega)
COPY --chown=node:node . .

# 6. Security: root ki jagah non-root 'node' user se container chalana
USER node

# 7. App ka port batana
EXPOSE 3000

# 8. Seedhe Node se server start karna (kam RAM + clean shutdown)
CMD ["node", "server.js"]





# ==============================================================================
# DOCKER TERMINAL COMMANDS CHEATSHEET (Hinglish Guide)
# ==============================================================================
#
# --- 1. IMAGE BANANA AUR DEKHNA ---
# docker build -t vaultx-backend .                  -> Current folder ke Dockerfile se 'vaultx-backend' naam ki image banata hai (-t = name/tag, . = current folder)
# docker build --no-cache -t vaultx-backend .       -> Purane cache ko chhod kar bilkul fresh image build karta hai
# docker images                                     -> System me jitni bhi Docker images saved hain unki list dikhata hai
# docker rmi vaultx-backend                         -> 'vaultx-backend' image ko delete karta hai (pehle uske containers delete karne honge)
#
# --- 2. CONTAINER RUN AUR STATUS CHECK KARNA ---
# docker run -d -p 3000:3000 --env-file .env --name vaultx-api vaultx-backend
#   -d                -> Detached mode: container background me chalega aur terminal free rahega
#   -p 3000:3000      -> Port mapping: laptop ka port 3000 container ke port 3000 se jodta hai
#   --env-file .env   -> .env file ki secret keys (MONGO_URI, JWT_SECRET) safely container me inject karta hai
#   --name vaultx-api -> Container ko readable naam 'vaultx-api' deta hai
#   vaultx-backend    -> Kis image se container chalana hai uska naam
# docker ps                                         -> Abhi jo containers chal rahe hain (running) unki list dikhata hai
# docker ps -a                                      -> Running + stopped dono tarah ke saare containers dikhata hai
#
# --- 3. LOGS DEKHNA AUR CONTAINER KE ANDAR JAANA ---
# docker logs vaultx-api                            -> Container ke ab tak ke logs print karta hai
# docker logs -f vaultx-api                         -> Live logs continuously dikhata hai (-f = follow; band karne ke liye Ctrl + C dabao)
# docker exec -it vaultx-api sh                     -> Chalte container ke andar terminal shell kholta hai (-it = interactive terminal; Alpine Linux me bash ki jagah sh hota hai; bahar aane ke liye 'exit' likho)
# docker stats                                      -> Live CPU aur RAM usage dikhata hai har running container ka
# docker inspect vaultx-api                         -> Container ki poori internal details (IP, network, env, ports) JSON me dikhata hai
#
# --- 4. CONTAINER KE ANDAR SE API CHECK KARNA (Bina Postman ke) ---
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/').then(r=>r.text()).then(console.log)"
#                                                   -> Container ke andar Node.js se seedhe GET / API test karta hai
#
# --- 5. CONTAINER STOP, RESTART AUR DELETE KARNA ---
# docker stop vaultx-api                            -> Chalte container ko gracefully band karta hai
# docker start vaultx-api                           -> Band kiye hue container ko wapas start karta hai
# docker restart vaultx-api                         -> Container ko restart karta hai
# docker rm vaultx-api                              -> Stopped container ko delete karta hai
# docker rm -f vaultx-api                           -> Running container ko force-stop karke seedhe delete karta hai
# docker system prune                               -> Faltu stopped containers aur unused cache clean karke storage bachata hai
#
# --- 6. DOCKER HUB PAR IMAGE PUSH & PULL KARNA (vishalkumar2501) ---
# docker login                                      -> Apne Docker Hub account me login karta hai
# docker tag vaultx-backend vishalkumar2501/vaultx-backend:v1
#                                                   -> Local image ko aapke Docker Hub username ke sath tag/rename karta hai
# docker build -t vishalkumar2501/vaultx-backend:v1 -t vishalkumar2501/vaultx-backend:latest .
#                                                   -> Ek hi command me image build karke 'v1' aur 'latest' dono tags banata hai
# docker push vishalkumar2501/vaultx-backend:latest -> Image ko Docker Hub par upload karta hai (agar net timeout aaye toh dubara chalao; bachi hui layers resume ho jayengi)
# docker push vishalkumar2501/vaultx-backend:v1     -> 'v1' version tag ko Docker Hub par push karta hai
#   (Slow Wi-Fi Tip: Docker Desktop Settings -> Docker Engine me "max-concurrent-uploads": 1 add karne se upload timeout nahi hota)
# docker pull vishalkumar2501/vaultx-backend:latest -> Kisi bhi dusre computer/server par aapki Docker Hub image download karta hai
# docker run -d -p 3000:3000 --env-file .env --name vaultx-api vishalkumar2501/vaultx-backend:latest
#                                                   -> Docker Hub wali live image se container start karta hai
#
# --- 7. KAISE PATA CHALEGA KI CONTAINER & SERVER 100% SAHI CHAL RAHA HAI? ---
# 1) docker ps chalao:
#    -> Sahi O/P: STATUS column me 'Up X minutes' aur PORTS me '0.0.0.0:3000->3000/tcp' dikhna chahiye.
#    -> Agar 'Exited (1)' ya 'Restarting' dikhe toh samjho app crash hui hai — 'docker logs vaultx-api' se error dekho.
# 2) docker logs vaultx-api chalao:
#    -> Sahi O/P: 'Server is running on port 3000' aur 'server is connected to DB' zaroor dikhna chahiye.
#
# --- 8. DOCKER KE ANDAR HI SAARI APIs TEST KARNA (Bina Postman ke) + EXPECTED O/P ---
# (Note: Niche commands me YOUR_TOKEN / ACC_ID ki jagah pichle step se mila real token / _id paste karein)
#
# [1] Health Check (GET /)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/').then(async r=>console.log(r.status,await r.text()))"
#   -> Sahi O/P: 200 Ledger Service is up and running
#
# [2] User Register (POST /api/auth/register)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Vishal',email:'vishal@test.com',password:'123456'})}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 201 { user: { _id: '...', email: 'vishal@test.com', name: 'Vishal' }, token: 'eyJ...' }
#   -> Agar email pehle se DB me hai: 422 { message: 'User already exists with email.', status: 'failed' }
#
# [3] User Login (POST /api/auth/login)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'vishal@test.com',password:'123456'})}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 200 { user: { _id: '...', email: 'vishal@test.com', name: 'Vishal' }, token: 'eyJ...' }
#   -> Galat password par: 401 { message: 'Email or password is INVALID' }
#
# [4] Create Bank Account (POST /api/accounts)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/accounts',{method:'POST',headers:{Authorization:'Bearer YOUR_TOKEN'}}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 201 { account: { _id: '...', user: '...', status: 'ACTIVE', currency: 'INR', ... } }
#
# [5] List My Accounts (GET /api/accounts)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/accounts',{headers:{Authorization:'Bearer YOUR_TOKEN'}}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 200 { accounts: [ { _id: '...', status: 'ACTIVE', currency: 'INR', ... } ] }
#
# [6] Check Live Derived Balance (GET /api/accounts/balance/<ACC_ID>)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/accounts/balance/YOUR_ACC_ID',{headers:{Authorization:'Bearer YOUR_TOKEN'}}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 200 { accountId: 'YOUR_ACC_ID', balance: 0 }  (Ya jitna credit balance hai)
#
# [7] System Initial Funds Add Karna (POST /api/transactions/system/initial-funds)
#   (Shart: MongoDB me user par systemUser: true hona chahiye + uska apna ek account bana hona chahiye)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/transactions/system/initial-funds',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer SYSTEM_TOKEN'},body:JSON.stringify({toAccount:'TARGET_ACC_ID',amount:5000,idempotencyKey:'init-001'})}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 201 { message: 'Initial funds transaction completed successfully', transaction: { status: 'COMPLETED', amount: 5000, ... } }
#   -> Normal user se try karne par: 403 { message: 'Forbidden access, not a system user' }
#
# [8] Atomic Money Transfer + Idempotency Test (POST /api/transactions)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/transactions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer SENDER_TOKEN'},body:JSON.stringify({fromAccount:'SENDER_ACC_ID',toAccount:'RECEIVER_ACC_ID',amount:500,idempotencyKey:'tx-001'})}).then(async r=>console.log(r.status,await r.json()))"
#   -> Pehli baar sahi O/P: 201 { message: 'Transaction completed successfully', transaction: { status: 'COMPLETED', amount: 500, ... } }
#   -> Same idempotencyKey se 2nd time O/P: 200 { message: 'Transaction already processed', transaction: ... } (Duplicate charge blocked!)
#   -> Doosre ke account se bhejne par (IDOR): 403 { message: 'Forbidden: You are not authorized to transfer from this account' }
#   -> Balance kam hone par: 400 { message: 'Insufficient balance. Current balance is ...' }
#
# [9] User Logout & Token Blacklist Verify (POST /api/auth/logout)
# docker exec vaultx-api node -e "fetch('http://127.0.0.1:3000/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer YOUR_TOKEN'}}).then(async r=>console.log(r.status,await r.json()))"
#   -> Sahi O/P: 200 { message: 'User logged out successfully' }
#   -> Ab usi purane token se GET /api/accounts chalane par: 401 { message: 'Unauthorized access, token is invalid' } (Blacklist working!)
#
#
# ==============================================================================
# DOCKER COMPOSE (docker-compose.yml) COMPLETE HINGLISH GUIDE
# ==============================================================================
#
# --- 9. DOCKER COMPOSE KYA HAI AUR ISKE CORE CONCEPTS ---
#
# 1) Compose kya hota hai?
#    -> Jab project me ek se zyada containers hon (jaise Frontend + Backend + MongoDB + Redis),
#       toh har ek ke liye baar-baar 'docker run' chalana mushkil hota hai.
#    -> 'docker-compose.yml' ek single blueprint file hoti hai jo EK HI COMMAND se sabhi
#       containers ko ek sath build, network, aur start kar deti hai!
#
# 2) Key Concepts (Interview + Practical):
#    - services       -> Har container ko Compose me ek 'service' kehte hain (jaise: frontend, backend, mongo).
#    - build          -> Local folder ke Dockerfile se nayi image banata hai (context: ./backend).
#    - image          -> Bane-banaye image ko Docker Hub se pull karta hai (jaise: mongo:7 ya vishalkumar2501/vaultx-backend:latest).
#    - ports          -> "HOST_PORT:CONTAINER_PORT" (jaise "3000:3000" -> laptop ke port ko container ke port se jodna).
#    - env_file       -> Poori .env file ki secret keys container me inject karta hai.
#    - environment    -> YAML ke andar hi direct ENV variables set karna (jaise NODE_ENV=production).
#    - depends_on     -> Startup order control karta hai (jaise: pehle 'mongo' start ho, uske baad 'backend', phir 'frontend').
#    - networks       -> Compose sabhi services ko ek common private Bridge Network me daalta hai.
#                        Iske andar 'localhost' ki jagah seedhe service name se baat hoti hai!
#                        (Jaise backend container 'mongodb://mongo:27017' ya frontend 'http://backend:3000' par connect karega).
#    - volumes        -> Data Persistence (data bachane) ke liye:
#                        (a) Named Volume (mongo_data:/data/db): Container delete hone par bhi DB ka data safe rehta hai.
#                        (b) Bind Mount (./src:/app/src): Dev me local code save karte hi container ke andar live update (Hot Reload).
#    - restart        -> Crash/reboot hone par container khud chalu ho jaye ('unless-stopped', 'always', 'on-failure').
#    - healthcheck    -> Check karta hai ki DB/App andar se sach me ready hai ya nahi (sirf port open hona kaafi nahi).
#
#
# --- 10. SAMPLE docker-compose.yml CODE (Backend + Frontend + MongoDB Ek Sath) ---
# (Niche diya code ek reference example hai; ise alag 'docker-compose.yml' file me bina '#' ke likhte hain)
#
# services:
#   mongo:                                        # Service 1: Local MongoDB Container
#     image: mongo:7                              # Docker Hub se official MongoDB image lega
#     container_name: vaultx-db
#     restart: unless-stopped                     # Crash hone par auto-restart
#     ports:
#       - "27017:27017"
#     volumes:
#       - mongo_data:/data/db                     # Named Volume: container delete hone par bhi DB data nahi udega
#     networks:
#       - vaultx-net                              # Same network par hone se 'backend' seedhe 'mongo' naam se connect kar payega
#
#   backend:                                      # Service 2: VaultX Node.js API
#     build:
#       context: ./backend                        # ./backend folder ke Dockerfile se build karega (ya single repo me '.')
#       dockerfile: Dockerfile
#     container_name: vaultx-api
#     restart: unless-stopped
#     ports:
#       - "3000:3000"
#     env_file:
#       - ./backend/.env                          # Secret keys load karega
#     environment:
#       - PORT=3000
#     depends_on:
#       - mongo                                   # Pehle 'mongo' start hoga, phir 'backend'
#     networks:
#       - vaultx-net
#
#   frontend:                                     # Service 3: React / Vite UI
#     build:
#       context: ./frontend
#     container_name: vaultx-ui
#     restart: unless-stopped
#     ports:
#       - "5173:5173"
#     environment:
#       - VITE_API_URL=http://localhost:3000/api
#     depends_on:
#       - backend                                 # Backend start hone ke baad Frontend start hoga
#     networks:
#       - vaultx-net
#
# volumes:                                        # Top-level Named Volumes declare karna zaroori hai
#   mongo_data:
#
# networks:                                       # Custom Bridge Network (optional; Compose default bhi banata hai)
#   vaultx-net:
#     driver: bridge
#
#
# --- 11. DOCKER COMPOSE COMMANDS (Frontend + Backend Ek Sath Start / Stop / Remove) ---
# (Note: Ye commands us folder me chalate hain jahan 'docker-compose.yml' file rakhi ho)
#
# [A] START & BUILD KARNA (Ek Sath Sab Containers)
# docker compose up                               -> Sabhi services (frontend + backend + db) build/start karta hai aur live logs dikhata hai
# docker compose up -d                            -> Sabhi services ko background (-d = detached) me start karta hai
# docker compose up -d --build                    -> Code change karne ke baad nayi images rebuild karke sabhi containers restart karta hai
# docker compose up -d backend                    -> Poori file me se sirf 'backend' service (aur uske depends_on) ko start karta hai
# docker compose build --no-cache                 -> Sabhi services ki bilkul fresh images bina purane cache ke build karta hai
#
# [B] STATUS, LOGS & DEBUGGING
# docker compose ps                               -> Sirf is project ke Compose containers ka status aur ports dikhata hai
# docker compose logs -f                          -> Frontend + Backend + DB sabhi ke combined live logs dikhata hai
# docker compose logs -f backend                  -> Sirf 'backend' container ke live logs filter karke dikhata hai
# docker compose exec backend sh                  -> Chal rahe 'backend' container ke andar terminal shell kholta hai
# docker compose config                           -> Check karta hai ki docker-compose.yml me koi syntax/indentation error toh nahi hai
#
# [C] STOP, RESTART & REMOVE (Cleanup)
# docker compose stop                             -> Sabhi chalte containers ko pause/band karta hai (containers & data safe rehte hain)
# docker compose start                            -> Band kiye hue Compose containers ko wapas start karta hai
# docker compose restart                          -> Sabhi services ko ek sath restart karta hai
# docker compose down                             -> Sabhi containers + internal network ko STOP aur DELETE karta hai (Named Volumes ka DB data safe rehta hai!)
# docker compose down -v                          -> Containers + networks + VOLUMES (DB ka saara data) bhi permanently delete karta hai (Fresh Reset!)
# docker compose down --rmi all                   -> Containers + networks + unse bani hui saari images bhi delete karta hai
#
# [D] SCALING (Advance Concept)
# docker compose up -d --scale backend=3          -> Ek hi backend ki 3 copies (containers) ek sath chalata hai (Load Balancing practice ke liye!)
#
#
# ==============================================================================
# DOCKER NETWORKING COMPLETE HINGLISH GUIDE (Concepts + Commands)
# ==============================================================================
#
# --- 12. DOCKER NETWORKING KYA HAI AUR KYU ZAROORI HAI? ---
#
# -> Problem: Har container apna ek alag mini-computer hota hai jiska apna 'localhost' hota hai.
#    Agar Backend container ke andar 'localhost:27017' likhoge, toh wo apne hi container ke andar
#    MongoDB dhoondhega — doosre MongoDB container ko nahi!
# -> Solution: Docker Networking ek virtual router/switch banata hai jisse containers aapas me,
#    host laptop se, aur internet se securely baat kar sakte hain.
#
#
# --- 13. DOCKER KE 5 NETWORK DRIVERS (Interview Most Asked!) ---
#
# 1) bridge (Default & Sabse Zyada Use Hone Wala):
#    - Ek hi laptop par chal rahe alag-alag containers ko aapas me connect karta hai.
#    - [Interview Question] Default bridge vs Custom bridge me kya farq hai?
#      * Default 'bridge'    -> Containers sirf IP (172.17.0.2) se baat kar sakte hain (IP badal sakti hai, naam se baat nahi hoti).
#      * Custom bridge       -> ('docker network create vaultx-net') me Docker apna AUTOMATIC DNS deta hai!
#                               Containers seedhe CONTAINER NAAM se baat kar sakte hain (jaise http://vaultx-api:3000)!
#
# 2) host:
#    - Container aur host machine ek hi network share karte hain (koi '-p 3000:3000' port mapping nahi lagti).
#    - Linux servers par ultra-fast performance ke liye use hota hai (Windows/Mac par Docker Desktop VM ki wajah se alag behave karta hai).
#
# 3) none:
#    - Container ka network bilkul kaat deta hai (no internet, no other containers).
#    - High-security offline batch scripts ya untrusted code run karne ke liye.
#
# 4) overlay:
#    - Jab alag-alag physical servers (multi-host / Docker Swarm) par chal rahe containers ko ek hi network me jodna ho.
#
# 5) macvlan:
#    - Container ko aapke physical router/Wi-Fi ka direct MAC address aur IP milta hai (bilkul asli hardware device jaisa).
#
#
# --- 14. 3 REAL-WORLD CONNECTION TRICKS (Daily Kaam Aane Wale) ---
#
# [Trick A] Container -> Host Laptop (host.docker.internal):
#   Agar Backend Docker container me hai aur MongoDB/Redis aapke Windows laptop par locally chal raha hai,
#   toh .env me 'localhost' ki jagah 'host.docker.internal' likhna hoga:
#   -> MONGO_URI=mongodb://host.docker.internal:27017/vaultx
#
# [Trick B] Container -> Container (Custom Network DNS):
#   Agar 'vaultx-db' aur 'vaultx-api' dono ek hi custom network 'vaultx-net' par chal rahe hain,
#   toh backend seedhe DB ke container name se connect karega (bina port -p expose kiye bhi!):
#   -> MONGO_URI=mongodb://vaultx-db:27017/vaultx
#
# [Trick C] Laptop/Postman -> Container (-p Port Mapping):
#   Laptop ke Postman se container ko access karne ke liye '-p HOST_PORT:CONTAINER_PORT' lagate hain:
#   -> docker run -p 8080:3000 ...  (Laptop par http://localhost:8080 khulega -> container ke port 3000 par jayega!)
#
#
# --- 15. DOCKER NETWORKING TERMINAL COMMANDS ---
#
# docker network ls                                 -> Laptop me bane saare Docker networks ki list dikhata hai
# docker network create vaultx-net                  -> Naya custom bridge network 'vaultx-net' banata hai (Automatic DNS ke sath)
# docker run -d --network vaultx-net --name vaultx-db mongo:7
#                                                   -> MongoDB container ko 'vaultx-net' network ke andar start karta hai
# docker run -d --network vaultx-net -p 3000:3000 --env-file .env --name vaultx-api vaultx-backend
#                                                   -> Backend container ko bhi usi 'vaultx-net' me chalata hai (dono aapas me naam se baat karenge)
# docker network connect vaultx-net vaultx-api      -> Pehle se chal rahe container ko 'vaultx-net' network se jodta hai
# docker network disconnect vaultx-net vaultx-api   -> Container ko 'vaultx-net' network se bahar nikalta hai
# docker network inspect vaultx-net                 -> Network ke andar kaun-kaun se containers aur unki exact IPs hain JSON me dikhata hai
# docker network rm vaultx-net                      -> Khali custom network ko delete karta hai (pehle containers disconnect hone chahiye)
# docker network prune                              -> Sabhi unused networks ko clean karke delete karta hai
#
#
# ==============================================================================
# DOCKER VOLUMES COMPLETE HINGLISH GUIDE (Full-Stack & Backend Essentials)
# ==============================================================================
#
# --- 16. DOCKER VOLUMES KYU ZAROORI HAIN? (Sabse Bada Problem & Solution) ---
#
# -> Problem (Ephemeral Containers):
#    Docker container temporary hota hai! Agar aapne MongoDB ya PostgreSQL container chalaya,
#    1000 users register kiye, aur galti se 'docker rm -f vaultx-db' kar diya — toh saara
#    database DATA hamesha ke liye DELETE ho jayega!
# -> Solution (Volumes):
#    Volume data ko container ke bahar host machine ki hard disk par safely store karta hai.
#    Container delete, crash, ya upgrade bhi ho jaye — aapka Database, Uploads, aur Logs 100% SAFE rahenge!
#
#
# --- 17. DOCKER STORAGE KE 3 TYPES (Interview + Daily Development) ---
#
# 1) Named Volume (Sabse Zyada Production & Database me Use Hota Hai):
#    - Docker khud iski location manage karta hai (Windows/Linux dono par super fast).
#    - Syntax: -v vaultx_mongo_data:/data/db
#    - Use Case: MongoDB/Postgres/Redis data, Multer uploaded images/PDFs, aur multiple containers ke beech file sharing.
#
# 2) Bind Mount (Full-Stack / Backend Live Coding & Hot Reload ke Liye!):
#    - Aapke laptop ka exact project folder seedhe container ke folder se link ho jata hai!
#    - VS Code me file save karte hi container ke andar turant change dikhta hai (bina 'docker build' kiye!).
#    - Windows CMD me '%cd%' aur PowerShell/Mac/Linux me '${PWD}' lagate hain:
#      * CMD        : -v "%cd%\src:/app/src"
#      * PowerShell : -v "${PWD}\src:/app/src"
#    - [PRO TRICK - Anonymous Volume]: Agar poora folder mount karo (-v "%cd%:/app"), toh Windows ki node_modules
#      container ki Linux node_modules ko kharab kar sakti hai! Isse bachne ke liye sath me '-v /app/node_modules' lagate hain.
#
# 3) tmpfs Mount (Sirf RAM Storage - Linux Only):
#    - Hard disk ke bajaye seedhe RAM me temporary data rakhta hai; container stop hote hi gayab (secret temp keys ke liye).
#
# [Bonus Security Flag - Read-Only ':ro']:
#    - Agar aap chahte ho ki container host ki files sirf PADH sake (edit/delete na kar sake), toh end me ':ro' lagao:
#      * -v "%cd%\config:/app/config:ro"
#
#
# --- 18. '-v' vs '--mount' SYNTAX (Interview Tip) ---
# -> Short form (-v)      : -v vaultx_mongo_data:/data/db
# -> Explicit (--mount)   : --mount type=volume,source=vaultx_mongo_data,target=/data/db
#    (Fayda: '--mount' zyada readable hai, aur Bind Mount me agar host folder missing ho toh silent bug ke bajaye clean error deta hai).
#
#
# --- 19. DOCKER VOLUMES KE SABHI ZAROOORI TERMINAL COMMANDS ---
#
# [A] VOLUMES BANANA, DEKHNA AUR INSPECT KARNA
# docker volume ls                                  -> System me bane saare Docker volumes ki list dikhata hai
# docker volume create vaultx_mongo_data            -> 'vaultx_mongo_data' naam ka naya persistent volume banata hai
# docker volume inspect vaultx_mongo_data           -> Volume ki exact details aur storage mountpoint JSON me dikhata hai
#
# [B] DATABASE CONTAINER KO PERSISTENT VOLUME KE SATH CHALANA (Real Backend Use!)
# docker run -d --name vaultx-db -p 27017:27017 -v vaultx_mongo_data:/data/db mongo:7
#                                                   -> MongoDB data ko 'vaultx_mongo_data' me hamesha ke liye save rakhega
#                                                      (Chahe vaultx-db container delete karke naya bana lo, purana data wapas milega!)
#
# [C] BACKEND LIVE DEVELOPMENT (Hot Reload Bind Mount - CMD Example)
# docker run -d -p 3000:3000 -v "%cd%\src:/app/src" -v /app/node_modules --env-file .env --name vaultx-dev vaultx-backend node --watch server.js
#                                                   -> Local 'src/' me code save karte hi Node 22 ka built-in '--watch' auto-restart karega!
#
# [D] FILE UPLOADS PERSIST KARNA (Multer / Receipts / Invoices ke liye)
# docker run -d -p 3000:3000 -v vaultx_uploads:/app/uploads --env-file .env --name vaultx-api vaultx-backend
#                                                   -> Container rebuild hone par bhi user ke uploaded files safe rahenge
#
# [E] VOLUMES CLEANUP AUR DELETE KARNA (Careful!)
# docker volume rm vaultx_mongo_data                -> Unused volume ko delete karta hai (pehle usse juda container delete hona chahiye)
# docker volume prune                               -> Sabhi unused (orphan) volumes ek sath delete karta hai (WARNING: DB data permanently ud sakta hai!)
#
# [F] COMPOSE REMINDER (Bahut Zaroori!)
# -> docker compose down                            -> Containers delete honge par Named Volumes (DB Data) SAFE rahega!
# -> docker compose down -v                         -> Containers + Named Volumes DONO delete honge (Poora DB reset!)
