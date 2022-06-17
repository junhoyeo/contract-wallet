# Contract Wallet

Basic Implementation of a Contract Wallet in Solidity. The owner can transfer Ether/ERC20 and execute transactions via low-level calls.

## Transfer

### Transfer Ether

```ts
await contractWallet
  .connect(owner)
  ["transfer(address,uint256)"](
    recipient.address,
    ethers.utils.parseEther("0.0001")
  );
```

### Transfer ERC20

```ts
await contractWallet
  .connect(owner)
  ["transfer(address,address,uint256)"](
    owner.address,
    tokenA.address,
    ethers.utils.parseEther("5")
  );
```

### Execute transactions

```ts
const populatedTx = await tokenA.populateTransaction.transfer(
  recipient.address,
  ethers.utils.parseEther("5.0045")
);

const executionTransaction = await contractWallet
  .connect(owner)
  .execute(tokenA.address, populatedTx.value ?? 0, populatedTx.data ?? "");
```
