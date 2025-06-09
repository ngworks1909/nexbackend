-- CreateIndex
CREATE INDEX "Game_gameId_gameName_idx" ON "Game"("gameId", "gameName");

-- CreateIndex
CREATE INDEX "Payment_paymentId_userId_idx" ON "Payment"("paymentId", "userId");

-- CreateIndex
CREATE INDEX "Room_roomId_idx" ON "Room"("roomId");

-- CreateIndex
CREATE INDEX "User_userId_mobile_idx" ON "User"("userId", "mobile");

-- CreateIndex
CREATE INDEX "Wallet_walletId_userId_idx" ON "Wallet"("walletId", "userId");
