
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BulletinBoardModule = buildModule("BulletinBoardModule", (m) => {
  const bulletinBoard = m.contract("BulletinBoard");
  return { bulletinBoard };
});

export default BulletinBoardModule;