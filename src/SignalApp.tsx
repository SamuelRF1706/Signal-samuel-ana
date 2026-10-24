import { BaseRouter } from "./routes/BaseRouter"
import Navbar from "./ui/components/NavBar"

const SignalApp = () => {
    return (
        <>
            <Navbar/>
            <BaseRouter/>
        </>
    )
}

export default SignalApp
