import { HomeLayout } from '@/modules/home/ui/layouts/home-layout';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  return <HomeLayout>{children}</HomeLayout>;
};

export default Layout;
