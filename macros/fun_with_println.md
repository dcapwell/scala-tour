# Fun with println
As with any programming language, the first thing you need to write is a "Hello World!" application.  So since macros are really a language in a language, then why not rebuild that first?

To start playing with macros, you can use the REPL (though it acts different than real code, will get to that)

```scala
$ scala
import scala.reflect.runtime.{universe => ru}
import ru._
```

Now that we have the runtime universe (like the compiler universe, but at runtime), lets define our macro!

```scala
import scala.reflect.macros.Context

def hello_impl(c: Context)(): c.Expr[Unit] = {
  import c.universe._

  reify { println("Hello World!") }
}

def hello(): Unit = macro hello_impl

hello()
// Hello World!
```

Great!  Now that we have mastered this in the REPL, lets use it in a real project?!?!?1

Here is what happens when you put the same code in a scala file and compile it

```scala
import scala.reflect.macros.Context

object DontCommit extends App {
  def hello(): Unit = macro hello_impl

  def hello_impl(c: Context)(): c.Expr[Unit] = {
    import c.universe._

    reify { println("Hello World") }
  }

  hello()
}

Error:(6, 7) macro definition needs to be enabled
by making the implicit value scala.language.experimental.macros visible.
This can be achieved by adding the import clause 'import scala.language.experimental.macros'
or by setting the compiler option -language:experimental.macros.
See the Scala docs for value scala.language.experimental.macros for a discussion
why the feature needs to be explicitly enabled.
  def hello(): Unit = macro hello_impl
      ^
```

So, scala likes to tell users that some features are too hard for them, so you must use an import statement to use these features (implicits, higher-kinds, macros, etc.).  To get around this, when the `macro` keyword is used, you must always add the import

```scala
import scala.language.experimental.macros
```

Ok, so we added that, so lets move on!

```scala
import scala.language.experimental.macros
import scala.reflect.macros.Context

object DontCommit extends App {
  def hello(): Unit = macro hello_impl

  def hello_impl(c: Context)(): c.Expr[Unit] = {
    import c.universe._

    reify { println("Hello World") }
  }

  hello()
}

Error:(16, 8) macro implementation not found: hello
(the most common reason for that is that you cannot use macro implementations in the same compilation run that defines them)
  hello()
       ^
```

GAH!  Macros must be defined in a different compile time than the usage?  Yep!  This is a current limitation to real code.  Workarounds were added so the REPL can get past this, but as of 2.11, macro code must be in a different jar than the user (src/main, src/test is safe, project/foo, project/bar is safe).

Ok, so if you move the caller to a different compile phase (normally different jar), then you get the same thing that you had when you ran the REPL.

So, what does it do?

Once you have the `Context` object, you import the universe which gives you access to a function `reify`.

```english
re·i·fy
ˈrēəˌfī/
verbformal
make (something abstract) more concrete or real.
"these instincts are, in humans, reified as verbal constructs"
```

So whats the abstract thing?  `println`?

Correct!  What `reify` does is takes a block of code and returns a `c.Expr` that is the AST form of that block of code.  For a large set of macros you will develop, you know how your generated code should look like (in scala), so this function is very very very helpful.
