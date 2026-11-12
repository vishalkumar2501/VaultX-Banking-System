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
