import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const ONLINE_TIMEOUT = 2 * 60 // 2分間アクティビティがないとオフラインとみなす

export function useOnlineStatus(userId: string) {
  useEffect(() => {
    if (!userId) return

    // Using the imported supabase instance

    let timeoutId: NodeJS.Timeout

    const updateOnlineStatus = async () => {
      try {
        const { error } = await supabase
          .from('online_status')
          .upsert(
            {
              user_id: userId,
              is_online: true,
              last_seen: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (error) throw error
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    }

    const handleActivity = () => {
      clearTimeout(timeoutId)
      updateOnlineStatus()
      timeoutId = setTimeout(() => {
        supabase
          .from('online_status')
          .upsert(
            {
              user_id: userId,
              is_online: false,
              last_seen: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .then(({ error }) => {
            if (error) console.error('Error updating offline status:', error)
          })
      }, ONLINE_TIMEOUT * 1000)
    }

    // イベントリスナーを設定
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    // 初期オンラインステータスを設定
    handleActivity()

    // クリーンアップ関数
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)

      // ページを離れる時にオフラインに設定
      supabase
        .from('online_status')
        .upsert(
          {
            user_id: userId,
            is_online: false,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Error updating offline status:', error)
        })
    }
  }, [userId])
}
