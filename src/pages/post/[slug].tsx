import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const wordsPerMinute = 200;

  const totalWords = Math.round(
    post.data.content.reduce(
      (acc, contentItem) =>
        acc +
        contentItem.heading.toString().split(' ').length +
        contentItem.body.reduce(
          (acc2, bodyItem) => acc2 + bodyItem.text.toString().split(' ').length,
          0
        ),
      0
    )
  );

  const totalMinutes = Math.ceil(totalWords / wordsPerMinute);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.mainContainer}>
        <article>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <div>
              <FiCalendar size={20} />
              <time>{post.first_publication_date}</time>
            </div>
            <div>
              <FiUser size={20} />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock size={20} />
              <p>{totalMinutes} min</p>
            </div>
          </div>
          <div className={styles.contentContainer}>
            {post.data.content.map(contentItem => (
              <div key={contentItem.heading}>
                <h2>{contentItem.heading}</h2>
                <div
                  className={styles.postContent}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentItem.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', {
    fetch: [],
  });

  return {
    paths: posts.results.map(post => ({
      params: { slug: post.id },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    uid: response.uid,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd-MMM-yyyy',
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 5, // 5min
  };
};
