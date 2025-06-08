import { render } from '@testing-library/react'
import { Providers } from './providers'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

// Mock jotai
jest.mock('jotai', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="jotai-provider">{children}</div>
  ),
}))

describe('Providers component', () => {
  it('should render children with providers', () => {
    const { getByTestId, getByText } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(getByTestId('session-provider')).toBeInTheDocument()
    expect(getByTestId('jotai-provider')).toBeInTheDocument()
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('should wrap children in correct provider order', () => {
    const { container } = render(
      <Providers>
        <div>Test</div>
      </Providers>
    )

    // SessionProvider should be the outer provider
    const sessionProvider = container.querySelector('[data-testid="session-provider"]')
    const jotaiProvider = container.querySelector('[data-testid="jotai-provider"]')
    
    expect(sessionProvider).toBeInTheDocument()
    expect(jotaiProvider).toBeInTheDocument()
    expect(sessionProvider).toContainElement(jotaiProvider)
  })
})