# Context
So what is the compiler's `Context`?  Its basically the main entry point for macros to tell the compiler what to do.  Compilers work with [AST](http://en.wikipedia.org/wiki/Abstract_syntax_tree)s or Abstract Syntax Trees so when you are working with the `Context`, you build up these ASTs in the form of `c.universe.Tree` instances.

## Useful Functions

### `c.freshName("foo")`
There are a few different versions of this function:

```scala
() => String
String => String
NameType => NameType
```

Each of these functions tries to give the caller a unique name for the given compilation run.  As of this writing, names are unique to the compilation run but does not hold true between runs, nor does it guarantee that the names will be the same for the call site between compile runs.  This may change with [SI-6879](https://issues.scala-lang.org/browse/SI-6879).

Based off the docs, the output is said to be unique but what the form is isn't defined.  Based off 2.11, here is an example of calling the `String => String` form.

```scala
val name = c.freshName("foo")
// foo$macro$1
val name = c.freshName("foo")
// foo$macro$2
```

Remember that `freshName` may not give the same results between compile runs, so when a class is `Serializable`, or inside a trait and using `val`s, or a param to a function/method that these are all part of the public API or binary compatibility. The main place `freshName` can be used safely is within a block or function scope.

### Logging
The compiler gives you a few ways to send messages to the user as a form of logging (not just warnings/compile errors).

```scala
// always logs
c.echo(c.enclosingPosition, "my msg")
// logs only if -verbose or last arg is true
c.info(c.enclosingPosition, "my msg", false)
// logs a compile warning
c.warning(c.enclosingPosition, "WARNING WILL ROBINSON")
// marks compiliation as failed
c.error(c.enclosingPosition, "COMPILE FAIL!")
// stops the world!
c.abort(c.enclosingPosition, "YOUR WORLD IS OVER!")
```

### Hear evil, `c.eval(x1)`, RUN!
This function does what it sounds like, it evals the expression inside the compiler and generates the results.  This can be useful for speeding up costly operations or avoiding boxing.

There is a limitation  [SI-5748](https://issues.scala-lang.org/browse/SI-5748) which says that `eval` doesn't work with typed trees.  To get around this, you must first untype the tree.

```scala
val x: c.Expr[String]
c.untypecheck(x.tree)
```

But here is the thing; typing mutates the tree, doesn't create a new one!  To make sure that mutability doesn't effect you (I did say that this is evil?), you should always `duplicate` the tree first

```scala
c.untypecheck(x.tree.duplicate)
```

Now that we have done that, lets show an example (taken from scala doc)

```scala
def impl(c: Context)(x: c.Expr[String]) = {
   val x1 = c.Expr[String](c.untypecheck(x.tree.duplicate))
   println(s"compile-time value is: ${c.eval(x1)}")
   x
}

def test(x: String) = macro impl

scala> test("x")
compile-time value is: x
res0: String = x

scala> test("x" + "y")
compile-time value is: xy
res1: String = xy

scala> val x = "x"
x: String = x

scala> test(x + "y")
compile-time value is: xy
res2: String = xy

scala> { val x = "x"; test(x + "y") }
error: exception during macro expansion:
scala.tools.reflect.ToolBoxError: reflective compilation failed
```

### There is more!
But Ill leave you to explore them; `you explore andThen =)`
