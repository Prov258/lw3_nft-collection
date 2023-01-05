import Head from "next/head"
import Web3Modal from "web3modal"
import { Contract, utils, providers } from "ethers"
import { useEffect, useRef, useState } from "react"
import { CRYPTODEVS_CONTRACT_ADDRESS, abi } from "../constants"
import styles from "../styles/Home.module.css"

export default function Home() {
    const [tokenIdsMinted, setTokenIdsMinted] = useState("0")
    const [walletConnected, setWalletConnected] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    const [presaleStarted, setPresaleStarted] = useState(false)
    const [presaleEnded, setPresaleEnded] = useState(false)

    const web3ModalRef = useRef()

    const presaleMint = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const cryptoDevsContract = new Contract(
                CRYPTODEVS_CONTRACT_ADDRESS,
                abi,
                signer
            )

            const tx = await cryptoDevsContract.presaleMint({
                value: utils.parseEther("0.01"),
            })
            setLoading(true)
            await tx.wait()
            setLoading(false)
            window.alert("You successfully minted a Crypto Dev!")
        } catch (err) {
            console.error(err)
        }
    }

    const publicMint = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const cryptoDevsContract = new Contract(
                CRYPTODEVS_CONTRACT_ADDRESS,
                abi,
                signer
            )

            const tx = await cryptoDevsContract.publicMint({
                value: utils.parseEther("0.01"),
            })
            setLoading(true)
            await tx.wait()
            setLoading(false)
            window.alert("You successfully minted a Crypto Dev!")
        } catch (err) {
            console.error(err)
        }
    }

    const startPresale = async () => {
        const signer = await getProviderOrSigner(true)
        const cryptoDevsContract = new Contract(
            CRYPTODEVS_CONTRACT_ADDRESS,
            abi,
            signer
        )
        const tx = await cryptoDevsContract.startPresale()
        setLoading(true)
        await tx.wait()
        setLoading(false)
        setPresaleStarted(await cryptoDevsContract.presaleStarted())
    }

    const getTokenIdsMinted = async () => {
        try {
            const provider = await getProviderOrSigner()
            const cryptoDevsContract = new Contract(
                CRYPTODEVS_CONTRACT_ADDRESS,
                abi,
                provider
            )

            setInterval(async () => {
                const tokenIds = await cryptoDevsContract.tokenIds()
                setTokenIdsMinted(tokenIds.toString())
            })
        } catch (err) {
            console.error(err.message)
        }
    }

    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner()
            const cryptoDevsContract = new Contract(
                CRYPTODEVS_CONTRACT_ADDRESS,
                abi,
                provider
            )

            const owner = await cryptoDevsContract.owner()
            const signer = await getProviderOrSigner(true)
            const signerAddress = await signer.getAddress()

            if (owner.toLowerCase() === signerAddress.toLowerCase()) {
                setIsOwner(true)
            }
        } catch (err) {
            console.error(err.message)
        }
    }

    const checkSaleTime = async () => {
        try {
            const provider = await getProviderOrSigner()

            const cryptoDevsContract = new Contract(
                CRYPTODEVS_CONTRACT_ADDRESS,
                abi,
                provider
            )

            let isPresaleStarted = await cryptoDevsContract.presaleStarted()

            if (isPresaleStarted) {
                setPresaleStarted(true)
            }

            const saleTimer = setInterval(async () => {
                if (!isPresaleStarted) {
                    isPresaleStarted = await cryptoDevsContract.presaleStarted()

                    if (isPresaleStarted) {
                        setPresaleStarted(true)
                    }
                } else {
                    const timePresaleEnd =
                        await cryptoDevsContract.presaleEnded()
                    if (timePresaleEnd.lt(Math.floor(Date.now() / 1000))) {
                        setPresaleEnded(true)
                        clearInterval(saleTimer)
                    }
                }
            }, 5000)
        } catch (err) {
            console.error(err)
        }
    }

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect()
        const web3Provider = new providers.Web3Provider(provider)

        const { chainId } = await web3Provider.getNetwork()
        if (chainId !== 5) {
            window.alert("Change the network to Goerli!")
            throw new Error("Change the network to Goerli!")
        }

        if (needSigner) {
            const signer = web3Provider.getSigner()
            return signer
        }

        return web3Provider
    }

    const connectWallet = async () => {
        await getProviderOrSigner()
        checkSaleTime()
        getOwner()
        getTokenIdsMinted()
        setWalletConnected(true)
    }

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            })
            connectWallet()
        }
    }, [])

    const renderButton = () => {
        if (walletConnected) {
            if (loading) {
                return <button className={styles.button}>Loading...</button>
            } else if (!presaleStarted && isOwner) {
                return (
                    <button onClick={startPresale} className={styles.button}>
                        Start presale
                    </button>
                )
            } else if (!presaleStarted) {
                return (
                    <div className={styles.description}>
                        Waiting to start...
                    </div>
                )
            } else if (presaleStarted && !presaleEnded) {
                return (
                    <div>
                        <div className={styles.description}>
                            Presale has started!!! If your address is
                            whitelisted, Mint a Crypto Dev 🥳
                        </div>
                        <button className={styles.button} onClick={presaleMint}>
                            Presale Mint 🚀
                        </button>
                    </div>
                )
            } else if (presaleEnded) {
                return (
                    <button onClick={publicMint} className={styles.button}>
                        Public Mint
                    </button>
                )
            }
        } else {
            return (
                <button onClick={connectWallet} className={styles.button}>
                    Connect Wallet
                </button>
            )
        }
    }

    return (
        <div>
            <Head>
                <title>Crypto Devs</title>
                <meta name="description" content="Whitelist-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
                    <div className={styles.description}>
                        Its an NFT collection for developers in Crypto.
                    </div>
                    <div className={styles.description}>
                        {tokenIdsMinted}/20 have been minted
                    </div>
                    {renderButton()}
                </div>
                <div>
                    <img className={styles.image} src="./cryptodevs/0.svg" />
                </div>
            </div>

            <footer className={styles.footer}>
                Made with &#10084; by Crypto Devs
            </footer>
        </div>
    )
}
