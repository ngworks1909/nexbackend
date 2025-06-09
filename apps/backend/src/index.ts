import express from "express"
import userRouter from "./routes/userRoute"
import dataRouter from './routes/dataRoute'
import paymentRouter from './routes/paymentRoute'
import withdrawRouter from './routes/withdrawRoute'
import gameRouter from './routes/gameRoute'
import cors from 'cors'
import dotenv from 'dotenv'


dotenv.config()
const app = express();

app.use(express.json())
app.use(express.static("public"))
app.use(cors())

app.use("/api/auth", userRouter)
app.use("/api/data", dataRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/withdraw", withdrawRouter)
app.use("/api/game", gameRouter)

app.listen(3001)