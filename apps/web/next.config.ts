import type { NextConfig } from 'next';

const config: NextConfig = {
  // standalone нужен только для образа (dokploy/Dockerfile.web).
  // Локально на Windows он падает: раскладка standalone создаёт симлинки,
  // а это требует прав администратора или developer mode.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  // внутренние пакеты собираются в оба формата, но Next компилирует их сам
  transpilePackages: ['@artshop/shared'],
  images: {
    // варианты и форматы готовит воркер заранее; Next не должен пережимать
    // их повторно и тратить CPU сервера
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    // ревалидация ISR по событию из админки
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default config;
