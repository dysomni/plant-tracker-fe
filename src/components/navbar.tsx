import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import { LogoutIcon, PlantIcon } from "@/components/icons";
import { useContext } from "react";
import { AuthContext } from "../auth";

export const Navbar = () => {
  const authContext = useContext(AuthContext);

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1 transition-colors"
            href="/"
          >
            <PlantIcon
              size={24}
              className="text-lime-600 dark:text-green-500 dark:bg-green-500"
            />
            <h1 className="text-2xl text-transparent bg-clip-text font-extrabold bg-gradient-to-l dark:bg-gradient-to-r from-green-700 to-lime-600 dark:from-green-500 dark:to-lime-400">
              Plant Tracker
            </h1>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="flex">
          <Button
            className="text-sm font-normal text-default-600"
            startContent={<LogoutIcon size={20} />}
            variant="shadow"
            isDisabled={authContext.userLoading || !authContext.user}
            onPress={authContext.logout}
          >
            Logout
          </Button>
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
