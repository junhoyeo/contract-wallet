import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Wallet } from "ethers";

import { ethers } from "hardhat";
import { ContractWallet, ERC20 } from "../typechain";

describe("Contract Wallet", function () {
  let owner: SignerWithAddress;
  let person: Wallet;
  let tokenA: ERC20, tokenB: ERC20;
  let contractWallet: ContractWallet;

  this.beforeAll(async () => {
    [owner] = await ethers.getSigners();

    const privateKey = ethers.Wallet.createRandom();
    person = new ethers.Wallet(privateKey, ethers.provider);

    const ERC20TokenFactory = await ethers.getContractFactory(
      "ERC20TokenFactory"
    );
    const tokenFactory = await ERC20TokenFactory.connect(owner).deploy();
    await tokenFactory.deployed();

    const tokenACreation = await tokenFactory
      .connect(owner)
      .deployNewERC20Token("Token A", "TKNA", 18, 100);
    const tokenAAddress = (await tokenACreation.wait()).events?.find(
      (e) => e.event === "ERC20TokenCreated"
    )?.args?.tokenAddress;
    tokenA = await ethers.getContractAt("ERC20", tokenAAddress, owner);

    const tokenBCreation = await tokenFactory
      .connect(owner)
      .deployNewERC20Token("Token B", "TKNB", 18, 100);
    const tokenBAddress = (await tokenBCreation.wait()).events?.find(
      (e) => e.event === "ERC20TokenCreated"
    )?.args?.tokenAddress;
    tokenB = await ethers.getContractAt("ERC20", tokenBAddress, owner);

    const ContractWallet = await ethers.getContractFactory("ContractWallet");
    contractWallet = await ContractWallet.connect(owner).deploy();
  });

  it("Users can receive and transfer ether", async () => {
    const balanceBefore = await ethers.provider.getBalance(
      contractWallet.address
    );
    expect(balanceBefore).equal(0);

    await owner.sendTransaction({
      to: contractWallet.address,
      value: ethers.utils.parseEther("1.0007"),
    });

    const balanceAfter = await ethers.provider.getBalance(
      contractWallet.address
    );
    expect(balanceAfter).equal(ethers.utils.parseEther("1.0007"));

    // can transfer ether to another address
    expect(await ethers.provider.getBalance(person.address)).equal(0);

    await contractWallet
      .connect(owner)
      ["transfer(address,uint256)"](
        person.address,
        ethers.utils.parseEther("0.0001")
      );

    const balanceAfterTransfer = await ethers.provider.getBalance(
      contractWallet.address
    );
    expect(balanceAfterTransfer).equal(ethers.utils.parseEther("1.0006"));

    expect(await ethers.provider.getBalance(person.address)).equal(
      ethers.utils.parseEther("0.0001")
    );
  });

  it("Users can receive and transfer ERC20 tokens", async () => {
    await tokenA
      .connect(owner)
      .transfer(contractWallet.address, ethers.utils.parseEther("10"));
    await tokenB
      .connect(owner)
      .transfer(contractWallet.address, ethers.utils.parseEther("20"));

    // contract wallet should have 10 TKNA / 20 TKNB
    expect(await tokenA.balanceOf(contractWallet.address)).equal(
      ethers.utils.parseEther("10")
    );
    expect(await tokenB.balanceOf(contractWallet.address)).equal(
      ethers.utils.parseEther("20")
    );

    // owner should have 90 TKNA / 80 TKNB
    expect(await tokenA.balanceOf(owner.address)).equal(
      ethers.utils.parseEther("90")
    );
    expect(await tokenB.balanceOf(owner.address)).equal(
      ethers.utils.parseEther("80")
    );

    // send 5 TKNA to owner and expect both balances
    await contractWallet
      .connect(owner)
      ["transfer(address,address,uint256)"](
        owner.address,
        tokenA.address,
        ethers.utils.parseEther("5")
      );

    expect(await tokenA.balanceOf(owner.address)).equal(
      ethers.utils.parseEther("95")
    );
    expect(await tokenA.balanceOf(contractWallet.address)).equal(
      ethers.utils.parseEther("5")
    );
  });

  it("Users can execute transactions", async () => {
    const populatedTx = await tokenA.populateTransaction.transfer(
      owner.address,
      ethers.utils.parseEther("5")
    );

    const executionTransaction = await contractWallet
      .connect(owner)
      .execute(tokenA.address, populatedTx.value ?? 0, populatedTx.data ?? "");

    const executedTransactionEvent = (
      await executionTransaction.wait()
    ).events?.find((e) => e.event === "ExecutedTransaction");
    console.log(executedTransactionEvent);

    expect(await tokenA.balanceOf(owner.address)).equal(
      ethers.utils.parseEther("100")
    );
    expect(await tokenA.balanceOf(contractWallet.address)).equal(
      ethers.utils.parseEther("0")
    );
  });
});
