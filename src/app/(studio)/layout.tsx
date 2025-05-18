import { StudioLayout } from '@/modules/studio/ui/layouts/studio-layout';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  return <StudioLayout>{children}</StudioLayout>;
};

export default Layout;
