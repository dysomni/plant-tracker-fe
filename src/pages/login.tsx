import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { useContext, useEffect, useState } from "react";
import { Alert } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import {
  fetchLoginAuthTokenPost,
  LoginAuthTokenPostError,
} from "../generated/api/plantsComponents";
import { AuthContext } from "../auth";
import { usePageLoading } from "../components/page-loading";

import DefaultLayout from "@/layouts/default";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginAuthTokenPostError | null>(
    null,
  );
  const disabled = userInput === "" || passwordInput === "" || loginLoading;

  const authContext = useContext(AuthContext);

  usePageLoading(false);
  useEffect(() => {
    if (authContext.user) {
      navigate("/"); // TODO: navigate to the previous path
    }
  }, [authContext.user]);

  return (
    <DefaultLayout>
      <Card className="text-center justify-center p-10 gap-5 max-w-screen-sm lg:max-w-screen-md w-full dark:border-2 dark:border-neutral-700">
        <h1 className="text-3xl font-bold">Login</h1>
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
          isLoading={loginLoading}
          onPress={async (_e) => {
            try {
              setLoginLoading(true);
              await fetchLoginAuthTokenPost({
                body: { username: userInput, password: passwordInput },
              });
              setLoginLoading(false);
              authContext.reload();
              navigate("/");
            } catch (error) {
              setLoginLoading(false);
              setLoginError(error as unknown as any);
            }
          }}
        >
          Login
        </Button>
        {loginError ? (
          <Alert
            color="warning"
            title={
              (loginError.payload as Record<string, string>)?.detail ??
              "Unknown error occured. Please try again later."
            }
          />
        ) : null}
      </Card>
      {/* </section> */}
    </DefaultLayout>
  );
};
