import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Card } from "@nextui-org/card";
import { useContext, useEffect, useState } from "react";
import {
  fetchLoginAuthTokenPost,
  LoginAuthTokenPostError,
} from "../generated/api/plantsComponents";
import { Alert } from "@nextui-org/react";
import { AuthContext } from "../auth";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginAuthTokenPostError | null>(
    null
  );
  const disabled = userInput === "" || passwordInput === "" || loginLoading;

  const authContext = useContext(AuthContext);
  useEffect(() => {
    if (authContext.user) {
      navigate("/"); // TODO: navigate to the previous path
    }
  }, [authContext.user, navigate]);

  return (
    <DefaultLayout>
      {/* <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10"> */}
      <Card className="text-center justify-center p-10 gap-5 max-w-screen-sm lg:max-w-screen-md w-full">
        <h1 className={title()}>Login</h1>
        <div className="flex flex-col gap-3">
          <Input
            label="Username"
            value={userInput}
            onValueChange={setUserInput}
          />
          <Input
            label="Password"
            type="password"
            value={passwordInput}
            onValueChange={setPasswordInput}
          />
        </div>
        <Button
          className="bg-green-500"
          isDisabled={disabled}
          onPress={async (_e) => {
            try {
              setLoginLoading(true);
              const response = await fetchLoginAuthTokenPost({
                body: { username: userInput, password: passwordInput },
              });
              setLoginLoading(false);
              authContext.reload();
              navigate("/");
            } catch (error) {
              setLoginLoading(false);
              setLoginError(error);
            }
          }}
          isLoading={loginLoading}
        >
          Login
        </Button>
        {loginError ? (
          <Alert
            color="warning"
            title={
              loginError.payload?.detail ||
              "Unknown error occured. Please try again later."
            }
          />
        ) : null}
      </Card>
      {/* </section> */}
    </DefaultLayout>
  );
};
