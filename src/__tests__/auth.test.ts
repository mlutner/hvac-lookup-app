import { describe, it, expect } from 'vitest'
import { canAccess, isMember, isAdmin, tierLevel, UserRole, MembershipTier } from '@/lib/auth'

describe('Auth Access Control', () => {
  describe('canAccess', () => {
    it('PUBLIC can access PUBLIC routes', () => {
      expect(canAccess('PUBLIC', 'PUBLIC')).toBe(true)
    })

    it('PUBLIC cannot access FREE routes', () => {
      expect(canAccess('PUBLIC', 'FREE')).toBe(false)
    })

    it('FREE can access FREE routes', () => {
      expect(canAccess('FREE', 'FREE')).toBe(true)
    })

    it('FREE cannot access MEMBER routes', () => {
      expect(canAccess('FREE', 'MEMBER')).toBe(false)
    })

    it('MEMBER can access MEMBER routes', () => {
      expect(canAccess('MEMBER', 'MEMBER')).toBe(true)
    })

    it('MEMBER cannot access ADMIN routes', () => {
      expect(canAccess('MEMBER', 'ADMIN')).toBe(false)
    })

    it('ADMIN can access all routes', () => {
      expect(canAccess('ADMIN', 'PUBLIC')).toBe(true)
      expect(canAccess('ADMIN', 'FREE')).toBe(true)
      expect(canAccess('ADMIN', 'MEMBER')).toBe(true)
      expect(canAccess('ADMIN', 'ADMIN')).toBe(true)
    })
  })

  describe('isMember', () => {
    it('PUBLIC is not a member', () => {
      expect(isMember('PUBLIC')).toBe(false)
    })

    it('FREE is not a member', () => {
      expect(isMember('FREE')).toBe(false)
    })

    it('MEMBER is a member', () => {
      expect(isMember('MEMBER')).toBe(true)
    })

    it('ADMIN is a member', () => {
      expect(isMember('ADMIN')).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('PUBLIC is not admin', () => {
      expect(isAdmin('PUBLIC')).toBe(false)
    })

    it('FREE is not admin', () => {
      expect(isAdmin('FREE')).toBe(false)
    })

    it('MEMBER is not admin', () => {
      expect(isAdmin('MEMBER')).toBe(false)
    })

    it('ADMIN is admin', () => {
      expect(isAdmin('ADMIN')).toBe(true)
    })
  })

  describe('tierLevel', () => {
    it('returns correct tier levels in order', () => {
      expect(tierLevel('FREE')).toBe(0)
      expect(tierLevel('GOLD')).toBe(1)
      expect(tierLevel('PLATINUM')).toBe(2)
      expect(tierLevel('TEAM')).toBe(3)
      expect(tierLevel('ENTERPRISE')).toBe(4)
    })

    it('higher tiers have higher levels', () => {
      expect(tierLevel('GOLD')).toBeGreaterThan(tierLevel('FREE'))
      expect(tierLevel('PLATINUM')).toBeGreaterThan(tierLevel('GOLD'))
      expect(tierLevel('TEAM')).toBeGreaterThan(tierLevel('PLATINUM'))
      expect(tierLevel('ENTERPRISE')).toBeGreaterThan(tierLevel('TEAM'))
    })
  })
})
