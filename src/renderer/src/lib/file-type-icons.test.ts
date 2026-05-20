import { describe, expect, it } from 'vitest'
import { File, FileCode, FileImage, FileJson, FileText } from 'lucide-react'
import { SiTypescript, SiJavascript, SiReact, SiRust, SiGo, SiPython } from 'react-icons/si'
import { getFileIconSpec, isTestFile } from './file-type-icons'

describe('getFileIconSpec — language extensions', () => {
  it('returns TypeScript mark for .ts', () => {
    const spec = getFileIconSpec('src/foo.ts')
    expect(spec.Icon).toBe(SiTypescript)
    expect(spec.isTest).toBe(false)
  })

  it('returns TypeScript mark for .tsx', () => {
    expect(getFileIconSpec('src/foo.tsx').Icon).toBe(SiTypescript)
  })

  it('returns TypeScript mark for .mts and .cts', () => {
    expect(getFileIconSpec('foo.mts').Icon).toBe(SiTypescript)
    expect(getFileIconSpec('foo.cts').Icon).toBe(SiTypescript)
  })

  it('returns JavaScript mark for .js / .mjs / .cjs', () => {
    expect(getFileIconSpec('foo.js').Icon).toBe(SiJavascript)
    expect(getFileIconSpec('foo.mjs').Icon).toBe(SiJavascript)
    expect(getFileIconSpec('foo.cjs').Icon).toBe(SiJavascript)
  })

  it('returns React mark for .jsx', () => {
    expect(getFileIconSpec('foo.jsx').Icon).toBe(SiReact)
  })

  it('returns Rust mark for .rs', () => {
    expect(getFileIconSpec('foo.rs').Icon).toBe(SiRust)
  })

  it('returns Go mark for .go', () => {
    expect(getFileIconSpec('foo.go').Icon).toBe(SiGo)
  })

  it('returns Python mark for .py', () => {
    expect(getFileIconSpec('foo.py').Icon).toBe(SiPython)
  })
})

describe('getFileIconSpec — non-language extensions stay on existing icons', () => {
  it('uses FileImage for .png', () => {
    expect(getFileIconSpec('foo.png').Icon).toBe(FileImage)
  })

  it('uses FileJson for .json', () => {
    expect(getFileIconSpec('foo.json').Icon).toBe(FileJson)
  })

  it('uses FileText for .md', () => {
    expect(getFileIconSpec('readme.md').Icon).toBe(FileText)
  })

  it('uses FileCode for unmapped code extensions (e.g. .hs)', () => {
    expect(getFileIconSpec('foo.hs').Icon).toBe(FileCode)
  })

  it('falls back to File for unknown extensions', () => {
    expect(getFileIconSpec('foo.xyz123').Icon).toBe(File)
  })

  it('falls back to File for files with no extension', () => {
    // .gitignore is in the by-name table, but a random no-extension filename should hit File.
    expect(getFileIconSpec('UNRELATED').Icon).toBe(File)
  })
})

describe('isTestFile', () => {
  it('detects JS/TS .test.* patterns', () => {
    expect(isTestFile('foo.test.ts')).toBe(true)
    expect(isTestFile('foo.test.tsx')).toBe(true)
    expect(isTestFile('foo.test.js')).toBe(true)
    expect(isTestFile('foo.test.jsx')).toBe(true)
    expect(isTestFile('foo.test.mjs')).toBe(true)
    expect(isTestFile('foo.test.cjs')).toBe(true)
    expect(isTestFile('foo.test.mts')).toBe(true)
    expect(isTestFile('foo.test.cts')).toBe(true)
  })

  it('detects JS/TS .spec.* patterns', () => {
    expect(isTestFile('foo.spec.ts')).toBe(true)
    expect(isTestFile('foo.spec.tsx')).toBe(true)
    expect(isTestFile('foo.spec.js')).toBe(true)
  })

  it('detects Go _test.go', () => {
    expect(isTestFile('handler_test.go')).toBe(true)
    expect(isTestFile('handler.go')).toBe(false)
  })

  it('detects Rust _test.rs', () => {
    expect(isTestFile('foo_test.rs')).toBe(true)
    expect(isTestFile('foo.rs')).toBe(false)
  })

  it('detects Python test_*.py and *_test.py', () => {
    expect(isTestFile('test_handler.py')).toBe(true)
    expect(isTestFile('handler_test.py')).toBe(true)
    expect(isTestFile('handler.py')).toBe(false)
  })

  it('detects Ruby _test.rb and _spec.rb', () => {
    expect(isTestFile('handler_test.rb')).toBe(true)
    expect(isTestFile('handler_spec.rb')).toBe(true)
    expect(isTestFile('handler.rb')).toBe(false)
  })

  it('detects Java *Test.java / *Tests.java / *TestCase.java', () => {
    expect(isTestFile('HandlerTest.java')).toBe(true)
    expect(isTestFile('HandlerTests.java')).toBe(true)
    expect(isTestFile('HandlerTestCase.java')).toBe(true)
    expect(isTestFile('Handler.java')).toBe(false)
  })

  it('is case-insensitive on path components', () => {
    expect(isTestFile('Foo.TEST.ts')).toBe(true)
    expect(isTestFile('Handler_TEST.go')).toBe(true)
  })

  it('returns false for non-test names', () => {
    expect(isTestFile('foo.ts')).toBe(false)
    expect(isTestFile('foo.rs')).toBe(false)
    expect(isTestFile('foo.go')).toBe(false)
  })
})

describe('getFileIconSpec — test files', () => {
  it('flags isTest=true for *.test.ts while keeping the TypeScript icon', () => {
    const spec = getFileIconSpec('foo.test.ts')
    expect(spec.Icon).toBe(SiTypescript)
    expect(spec.isTest).toBe(true)
  })

  it('flags isTest=true for *_test.go while keeping the Go icon', () => {
    const spec = getFileIconSpec('handler_test.go')
    expect(spec.Icon).toBe(SiGo)
    expect(spec.isTest).toBe(true)
  })

  it('flags isTest=true for *_test.py while keeping the Python icon', () => {
    const spec = getFileIconSpec('handler_test.py')
    expect(spec.Icon).toBe(SiPython)
    expect(spec.isTest).toBe(true)
  })
})
