import { render } from '@testing-library/react'
import { Providers } from './providers'

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

jest.mock('jotai', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="jotai-provider">{children}</div>
  ),
}))

describe('Providersコンポーネント', () => {
  it('プロバイダーで子要素をラップしてレンダリングする', () => {
    const { getByTestId, getByText } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )
    expect(getByTestId('session-provider')).toBeInTheDocument()
    expect(getByTestId('jotai-provider')).toBeInTheDocument()
    expect(getByText('Test Content')).toBeInTheDocument()
  })
})