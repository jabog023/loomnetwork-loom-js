import ethutil from 'ethereumjs-util'
import Web3 from 'web3'
import { ethers } from 'ethers'
import { Account } from 'web3/eth/accounts'

const web3 = new Web3()

export function soliditySha3(...values: any[]): string {
  return (web3.utils.soliditySha3 as any)(...values)
}

/**
 * Signs messages using an Ethereum private key.
 */
export interface IEthereumSigner {
  signAsync(msg: string): Promise<Uint8Array>
}

/**
 * Signs message using a Web3 account.
 * This signer should be used for interactive signing in the browser with MetaMask.
 */
export class EthersSigner implements IEthereumSigner {
  private _wallet: ethers.Signer

  /**
   * @param web3 Web3 instance to use for signing.
   * @param accountAddress Address of web3 account to sign with.
   */
  constructor(wallet: ethers.Signer) {
    this._wallet = wallet
  }

  /**
   * Signs a message.
   * @param msg Message to sign.
   * @returns Promise that will be resolved with the signature bytes.
   */
  async signAsync(msg: string): Promise<Uint8Array> {
    let flatSig = await this._wallet.signMessage(ethers.utils.arrayify(msg))
    const sig = ethers.utils.splitSignature(flatSig)
    let v = sig.v!
    if (v === 0 || v === 1) {
      v += 27
    }
    flatSig = '0x01' + sig.r.slice(2) + sig.s.slice(2) + v.toString(16)
    return ethutil.toBuffer(flatSig)
  }
}

/**
 * Signs message using a Web3 account.
 * This signer should be used for interactive signing in the browser with MetaMask.
 */
export class Web3Signer implements IEthereumSigner {
  private _web3: Web3
  private _address: string

  /**
   * @param web3 Web3 instance to use for signing.
   * @param accountAddress Address of web3 account to sign with.
   */
  constructor(web3: Web3, accountAddress: string) {
    this._web3 = web3
    this._address = accountAddress
  }

  /**
   * Signs a message.
   * @param msg Message to sign.
   * @returns Promise that will be resolved with the signature bytes.
   */
  async signAsync(msg: string): Promise<Uint8Array> {
    const signature = await this._web3.eth.sign(msg, this._address)
    const sig = signature.slice(2)

    let mode = 1 // Geth
    const r = ethutil.toBuffer('0x' + sig.substring(0, 64)) as Buffer
    const s = ethutil.toBuffer('0x' + sig.substring(64, 128)) as Buffer
    let v = parseInt(sig.substring(128, 130), 16)

    if (v === 0 || v === 1) {
      v += 27
    } else {
      mode = 0 // indicate that msg wasn't prefixed before signing (MetaMask doesn't prefix!)
    }
    return Buffer.concat([ethutil.toBuffer(mode) as Buffer, r, s, ethutil.toBuffer(v) as Buffer])
  }
}

/**
 * THIS IS BEING DEPRECATED
 * Signs message using a Web3 account.
 * This signer should be used for signing in NodeJS.
 */
export class OfflineWeb3Signer implements IEthereumSigner {
  private _web3: Web3
  private _account: Account

  /**
   * @param web3 Web3 instance to use for signing.
   * @param accountAddress Address of web3 account to sign with.
   */
  constructor(web3: Web3, account: Account) {
    this._web3 = web3
    this._account = account
  }

  /**
   * Signs a message.
   * @param msg Message to sign.
   * @returns Promise that will be resolved with the signature bytes.
   */
  async signAsync(msg: string): Promise<Uint8Array> {
    const ret = await this._web3.eth.accounts.sign(msg, this._account.privateKey)
    // @ts-ignore
    const sig = ret.signature.slice(2)

    let mode = 1 // Geth
    const r = ethutil.toBuffer('0x' + sig.substring(0, 64)) as Buffer
    const s = ethutil.toBuffer('0x' + sig.substring(64, 128)) as Buffer
    let v = parseInt(sig.substring(128, 130), 16)

    return Buffer.concat([ethutil.toBuffer(mode) as Buffer, r, s, ethutil.toBuffer(v) as Buffer])
  }
}
