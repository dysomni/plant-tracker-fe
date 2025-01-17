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

import { ThemeSwitch } from "@/components/theme-switch";
import { LogoutIcon, PlantIcon } from "@/components/icons";
import { useContext } from "react";
import { AuthContext } from "../auth";

export const Navbar = () => {
  const authContext = useContext(AuthContext);

  const currentPathStyles = (path: string) => {
    if (path === window.location.pathname) {
      return "text-lime-600 dark:text-green-500 font-bold";
    }
    return "text-black dark:text-white";
  };

  return (
    <NextUINavbar maxWidth="xl" position="sticky" disableAnimation>
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarMenuToggle className="sm:hidden" />
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1 transition-colors"
            href="/"
          >
            <PlantIcon
              size={24}
              className="text-lime-600 dark:text-green-500 dark:bg-green-500"
            />
            <h1 className="text-lg sm:text-2xl text-transparent bg-clip-text font-extrabold bg-gradient-to-l dark:bg-gradient-to-r from-green-700 to-lime-600 dark:from-green-500 dark:to-lime-400">
              Plant Tracker
            </h1>
          </Link>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className="basis-full hidden sm:flex" justify="center">
        <NavbarItem className="flex gap-2">
          <Link className={currentPathStyles("/")} href="/">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem className="flex gap-2">
          <Link className={currentPathStyles("/plants")} href="/plants">
            Plants
          </Link>
        </NavbarItem>
        <NavbarItem className="flex gap-2">
          <Link className={currentPathStyles("/locations")} href="/locations">
            Locations
          </Link>
        </NavbarItem>
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
            size="sm"
          >
            Logout
          </Button>
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <Link className={currentPathStyles("/")} href="/" size="lg">
              Home
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className={currentPathStyles("/plants")}
              href="/plants"
              size="lg"
            >
              Plants
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className={currentPathStyles("/locations")}
              href="/locations"
              size="lg"
            >
              Locations
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
