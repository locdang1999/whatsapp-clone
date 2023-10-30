import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Login from './login';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/config/firebase.config';
import Loading from '@/components/Loading';
import { useEffect } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';


export default function App({ Component, pageProps }: AppProps) {
  const [loggedInUser, loading, _error] = useAuthState(auth);

  useEffect(() => {
    const setUserInDb = async () => {
      try {
        await setDoc(
          doc(db, 'users', loggedInUser?.email as string), //tạo ra bản users trong DB, để nhận biết thì thực tế sẽ loggedInUser?.uid
          {
            email: loggedInUser?.email,
            lastSeen: serverTimestamp(),
            photoURL: loggedInUser?.photoURL
          },
          {
            merge: true // sẽ kiểm tra xe dưới DB có đăng nhập chưa, nếu rồi nó sẽ merge 2 thằng lại thành 1
          }
        )
      } catch (error) {
        console.log("Error setting user info in DB", error)
      }
    }

    if (loggedInUser) {
      setUserInDb()
    }
  }, [loggedInUser])

  if (loading) {
    return <Loading />
  }

  if (!loggedInUser) {
    return <Login />
  }

  return <Component {...pageProps} />
}
