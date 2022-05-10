import { CliUx, Command, Flags } from '@oclif/core'
import Web3 from 'web3'
import userConfig, { defaults } from '../../config'
import fs from 'fs'
import os from 'os'
import erc20Json from '../../abis/erc20.json'
import { AbiItem } from 'web3-utils'
import { checkMaticBalance } from '../../utils/wallet'

export default class AccountBalance extends Command {
  static description = 'Get the balance of your ETH wallet'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {}

  static args = [{
    name: 'tokenSymbol',
    description: 'symbol of the ERC20 token',
    default: 'USD'
  }]

  public async run(): Promise<void> {
    const {
      args,
    } = await this.parse(AccountBalance)

    const web3 = new Web3(defaults.provider.alchemyMumbai)
    const baseDir = os.homedir() + '/.openlab'

    if (!fs.existsSync(baseDir + '/wallet.json')) {
      this.log("Wallet doesn't exist")
    }

    else {
      const erc20Symbol: string = args.tokenSymbol
      // const erc20Address = userConfig.get('tokens')['maticMumbai'][erc20Symbol]
      const erc20Address = defaults.tokens.maticMumbai.USD
      const erc20Contract = new web3.eth.Contract(erc20Json as AbiItem[], erc20Address)
      const password = await CliUx.ux.prompt('Enter a password to decrypt your wallet', { type: 'hide' })
      const keystoreJsonV3 = JSON.parse(fs.readFileSync(baseDir + '/wallet.json', 'utf-8'))
      const account = web3.eth.accounts.decrypt(keystoreJsonV3, password)
      const rawbalance = await erc20Contract.methods.balanceOf(account.address).call()
      const erc20Balance = web3.utils.fromWei(rawbalance)
      const maticBalance = await checkMaticBalance(account.address)
      this.log(`MATIC balance: ${maticBalance}`)
      this.log(`${args.tokenSymbol} balance: ${erc20Balance}`)
    }
  }
}
