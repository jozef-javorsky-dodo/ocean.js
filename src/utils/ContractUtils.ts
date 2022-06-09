import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { Contract } from 'web3-eth-contract'
import {
  Erc20CreateParams,
  FreCreationParams,
  FreOrderParams,
  PoolCreationParams
} from '../@types'
import { Config } from '../config'
import { generateDtName, minAbi, LoggerInstance, GASLIMIT_DEFAULT, ZERO_ADDRESS } from '.'

export function setContractDefaults(contract: Contract, config: Config): Contract {
  if (config) {
    if (config.transactionBlockTimeout)
      contract.transactionBlockTimeout = config.transactionBlockTimeout
    if (config.transactionConfirmationBlocks)
      contract.transactionConfirmationBlocks = config.transactionConfirmationBlocks
    if (config.transactionPollingTimeout)
      contract.transactionPollingTimeout = config.transactionPollingTimeout
  }
  return contract
}

export async function getFairGasPrice(web3: Web3, config: Config): Promise<string> {
  const x = new BigNumber(await web3.eth.getGasPrice())
  if (config && config.gasFeeMultiplier)
    return x
      .multipliedBy(config.gasFeeMultiplier)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString(10)
  else return x.toString(10)
}

export async function unitsToAmount(
  web3: Web3,
  token: string,
  amount: string,
  tokenDecimals?: number
): Promise<string> {
  try {
    const tokenContract = new web3.eth.Contract(minAbi, token)
    let decimals = tokenDecimals || (await tokenContract.methods.decimals().call())
    if (decimals === '0') {
      decimals = 18
    }

    const amountFormatted = new BigNumber(amount).div(
      new BigNumber(10).exponentiatedBy(decimals)
    )

    BigNumber.config({ EXPONENTIAL_AT: 50 })
    return amountFormatted.toString()
  } catch (e) {
    LoggerInstance.error(`ERROR: FAILED TO CALL DECIMALS(), USING 18' : ${e.message}`)
  }
}

export async function amountToUnits(
  web3: Web3,
  token: string,
  amount: string,
  tokenDecimals?: number
): Promise<string> {
  try {
    const tokenContract = new web3.eth.Contract(minAbi, token)
    let decimals = tokenDecimals || (await tokenContract.methods.decimals().call())
    if (decimals === '0') {
      decimals = 18
    }
    BigNumber.config({ EXPONENTIAL_AT: 50 })

    const amountFormatted = new BigNumber(amount).times(
      new BigNumber(10).exponentiatedBy(decimals)
    )

    return amountFormatted.toString()
  } catch (e) {
    LoggerInstance.error(`ERROR: FAILED TO CALL DECIMALS(), USING 18', ${e.message}`)
  }
}

/**
 * Estimates the gas used when a function would be executed on chain
 * @param {string} from account that calls the function
 * @param {Function} functionToEstimateGas function that we need to estimate the gas
 * @param {...any[]} args arguments of the function
 * @return {Promise<number>} gas cost of the function
 */
export async function estimateGas(
  from: string,
  functionToEstimateGas: Function,
  ...args: any[]
): Promise<any> {
  let estimatedGas = GASLIMIT_DEFAULT
  try {
    estimatedGas = await functionToEstimateGas.apply(null, args).estimateGas(
      {
        from: from
      },
      (err, estGas) => (err ? GASLIMIT_DEFAULT : estGas)
    )
  } catch (e) {
    LoggerInstance.error(`ERROR: Estimate gas failed!`, e)
  }
  return estimatedGas
}
