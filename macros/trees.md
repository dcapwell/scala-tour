# Trees
When you get deeper into macros, you will find yourself working with the `Tree` instances directly (quasiquotes are some times not as easy to use).  When this happens, you will need to know which instances to use.

This section really just outputs whats in [Scala's Trees.scala](https://github.com/scala/scala/blob/2.11.x/src/reflect/scala/reflect/api/Trees.scala#L308).  Main reason for this is that I find this doc faster to look things up than in intellij (the whole trait within trait within trait that defines a trait thing... intellij has a harder time searching this.  I know I can search for the known case class, but intellij always infers the traits/vals, which are longer to find the APIs for).

If you prefer ScalaDocs, you can look at them [here](http://www.scala-lang.org/files/archive/nightly/docs/library/index.html#scala.reflect.api.Trees).  Again, I find those docs to have way too much noise.

Also, I find that writing this out really helps me figure out how the trees work.

## Modifiers
Thie type doesn't really map to normal scala code, but many things have modifiers.

```scala
lazy val foo: String
```

In this example, foo has modifiers, namely lazy (which is really a flag).

As case class:

```scala
case class Modifiers(flags: Long, privateWithin: Name, annotations: List[Tree]) {
    def hasFlag(flag: FlagSet): Boolean
    def mapAnnotations(f: List[Tree] => List[Tree]): Modifiers
}
```

## FlagSet
A FlagSet is a single instance or a set of instances of flags.  So what are flags?

```scala
/** Flag indicating that tree represents a trait */
val TRAIT: FlagSet

/** Flag indicating that a tree is an interface (i.e. a trait which defines only abstract methods) */
val INTERFACE: FlagSet

/** Flag indicating that tree represents a mutable variable */
val MUTABLE: FlagSet

/** Flag indicating that tree represents a macro definition. */
val MACRO: FlagSet

/** Flag indicating that tree represents an abstract type, method, or value */
val DEFERRED: FlagSet

/** Flag indicating that tree represents an abstract class */
val ABSTRACT: FlagSet

/** Flag indicating that tree has `final` modifier set */
val FINAL: FlagSet

/** Flag indicating that tree has `sealed` modifier set */
val SEALED: FlagSet

/** Flag indicating that tree has `implicit` modifier set */
val IMPLICIT: FlagSet

/** Flag indicating that tree has `lazy` modifier set */
val LAZY: FlagSet

/** Flag indicating that tree has `override` modifier set */
val OVERRIDE: FlagSet

/** Flag indicating that tree has `private` modifier set */
val PRIVATE: FlagSet

/** Flag indicating that tree has `protected` modifier set */
val PROTECTED: FlagSet

/** Flag indicating that tree represents a member local to current class,
*  i.e. private[this] or protected[this].
*  This requires having either PRIVATE or PROTECTED set as well.
*/
val LOCAL: FlagSet

/** Flag indicating that tree has `case` modifier set */
val CASE: FlagSet

/** Flag indicating that tree has `abstract` and `override` modifiers set */
val ABSOVERRIDE: FlagSet

/** Flag indicating that tree represents a by-name parameter */
val BYNAMEPARAM: FlagSet

/** Flag indicating that tree represents a class or parameter.
*  Both type and value parameters carry the flag. */
val PARAM: FlagSet

/** Flag indicating that tree represents a covariant
*  type parameter (marked with `+`). */
val COVARIANT: FlagSet

/** Flag indicating that tree represents a contravariant
*  type parameter (marked with `-`). */
val CONTRAVARIANT: FlagSet

/** Flag indicating that tree represents a parameter that has a default value */
val DEFAULTPARAM: FlagSet

/** Flag indicating that tree represents an early definition */
val PRESUPER: FlagSet

/** Flag indicating that tree represents a variable or a member initialized to the default value */
val DEFAULTINIT: FlagSet

/** Flag indicating that tree represents an enum.
*
*  It can only appear at
*  - the enum's class
*  - enum constants
**/
val ENUM: FlagSet

/** Flag indicating that tree represents a parameter of the primary constructor of some class
*  or a synthetic member underlying thereof. E.g. here's how 'class C(val x: Int)' is represented:
*
*      [[syntax trees at end of parser]]// Scala source: tmposDU52
*      class C extends scala.AnyRef {
*        <paramaccessor> val x: Int = _;
*        def <init>(x: Int) = {
*          super.<init>();
*          ()
*        }
*      }
*      ClassDef(
*        Modifiers(), TypeName("C"), List(),
*        Template(
*          List(Select(Ident(scala), TypeName("AnyRef"))),
*          noSelfType,
*          List(
*            ValDef(Modifiers(PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree),
*            DefDef(
*              Modifiers(), nme.CONSTRUCTOR, List(),
*              List(List(ValDef(Modifiers(PARAM | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree))), TypeTree(),
*              Block(List(pendingSuperCall), Literal(Constant(())))))))))
*/
val PARAMACCESSOR: FlagSet

/** Flag indicating that tree represents a parameter of the primary constructor of some case class
*  or a synthetic member underlying thereof.  E.g. here's how 'case class C(val x: Int)' is represented:
*
*      [[syntax trees at end of parser]]// Scala source: tmpnHkJ3y
*      case class C extends scala.Product with scala.Serializable {
*        <caseaccessor> <paramaccessor> val x: Int = _;
*        def <init>(x: Int) = {
*          super.<init>();
*          ()
*        }
*      }
*      ClassDef(
*        Modifiers(CASE), TypeName("C"), List(),
*        Template(
*          List(Select(Ident(scala), TypeName("Product")), Select(Ident(scala), TypeName("Serializable"))),
*          noSelfType,
*          List(
*            ValDef(Modifiers(CASEACCESSOR | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree),
*            DefDef(
*              Modifiers(), nme.CONSTRUCTOR, List(),
*              List(List(ValDef(Modifiers(PARAM | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree))), TypeTree(),
*              Block(List(pendingSuperCall), Literal(Constant(())))))))))
*/
val CASEACCESSOR: FlagSet

/** Flag used to distinguish programmatically generated definitions from user-written ones.
*  @see ARTIFACT
*/
val SYNTHETIC: FlagSet

/** Flag used to distinguish platform-specific implementation details.
*  Trees and symbols which are currently marked ARTIFACT by scalac:
*    * $outer fields and accessors
*    * super accessors
*    * protected accessors
*    * lazy local accessors
*    * bridge methods
*    * default argument getters
*    * evaluation-order preserving locals for right-associative and out-of-order named arguments
*    * catch-expression storing vals
*    * anything else which feels a setFlag(ARTIFACT)
*
*  @see SYNTHETIC
*/
val ARTIFACT: FlagSet

/** Flag that indicates methods that are supposed to be stable
*  (e.g. synthetic getters of valdefs).
*/
val STABLE: FlagSet

/** The empty set of flags
*  @group Flags
*/
val NoFlags: FlagSet
```

## ValDef
Maps to `val foo = ...`.  It contains the type of variable (val, var), name, type, and rhs (right-hand-side, aka expression).

As case class:

```scala
case class ValDef(mods: Modifiers, name: TermName, tpt: Tree, rhs: Tree)
```

## ClassDef
This type maps to `<mods> class Foo[A](...) ...` and also trait defs.

As case class:

```scala
case class ClassDef(mods: Modifiers, name: TypeName, tparams: List[TypeDef], impl: Template)
```

## Template
Template is really the content of a `ClassDef`.

As case class:

```scala
case class Template(parents: List[Tree], self: ValDef, body: List[Tree])
```

`parents` map to `extends` and `with` calls.  Order matters to this list, so make sure the `.head` element maps to the expected `extends` type.

`self` maps to `self: Foo =>` in traits

```scala
scala> q"""
 trait Foo { self: String =>
    def toString: String = self.toString
 }
"""
res0: reflect.runtime.universe.ClassDef =
abstract trait Foo extends scala.AnyRef { self: String =>
  def $init$() = {
    ()
  };
  def toString: String = self.toString
}
scala> res0.impl.self
res1: reflect.runtime.universe.ValDef = private val self: String = _
```

Notes on `body`, order matters!  I found this out while trying to reinvent case classes as a macro (cause thats sain right?...).  I took all the class params and replaced them with `private[this]` params followed by `DefDef` (coming to this tree).  When I did this I got a very weird `MatchError` message, and while debugging the compiler code it became clear that scala makes assumptions about how the body looks like.

Here is the code incase it bites you:

```scala
// undo gen.mkTemplate
    protected object UnMkTemplate {
      def unapply(templ: Template): Option[(List[Tree], ValDef, Modifiers, List[List[ValDef]], List[Tree], List[Tree])] = {
        val Template(parents, selfType, _) = templ
        val tbody = treeInfo.untypecheckedTemplBody(templ)

        def result(ctorMods: Modifiers, vparamss: List[List[ValDef]], edefs: List[Tree], body: List[Tree]) =
          Some((parents, selfType, ctorMods, vparamss, edefs, body))
        def indexOfCtor(trees: List[Tree]) =
          trees.indexWhere { case UnCtor(_, _, _) => true ; case _ => false }

        if (tbody forall treeInfo.isInterfaceMember)
          result(NoMods | Flag.TRAIT, Nil, Nil, tbody)
        else if (indexOfCtor(tbody) == -1)
          None
        else {
          val (rawEdefs, rest) = tbody.span(treeInfo.isEarlyDef)
          val (gvdefs, etdefs) = rawEdefs.partition(treeInfo.isEarlyValDef)
          val (fieldDefs, UnCtor(ctorMods, ctorVparamss, lvdefs) :: body) = rest.splitAt(indexOfCtor(rest))
          val evdefs = gvdefs.zip(lvdefs).map {
            case (gvdef @ ValDef(_, _, tpt: TypeTree, _), ValDef(_, _, _, rhs)) =>
              copyValDef(gvdef)(tpt = tpt.original, rhs = rhs)
          }
          val edefs = evdefs ::: etdefs
          if (ctorMods.isTrait)
            result(ctorMods, Nil, edefs, body)
          else {
            // undo conversion from (implicit ... ) to ()(implicit ... ) when its the only parameter section
            val vparamssRestoredImplicits = ctorVparamss match {
              case Nil :: (tail @ ((head :: _) :: _)) if head.mods.isImplicit => tail
              case other => other
            }
            // undo flag modifications by merging flag info from constructor args and fieldDefs
            val modsMap = fieldDefs.map { case ValDef(mods, name, _, _) => name -> mods }.toMap
            def ctorArgsCorrespondToFields = vparamssRestoredImplicits.flatten.forall { vd => modsMap.contains(vd.name) }
            if (!ctorArgsCorrespondToFields) None
            else {
              val vparamss = mmap(vparamssRestoredImplicits) { vd =>
                val originalMods = modsMap(vd.name) | (vd.mods.flags & DEFAULTPARAM)
                atPos(vd.pos)(ValDef(originalMods, vd.name, vd.tpt, vd.rhs))
              }
              result(ctorMods, vparamss, edefs, body)
            }
          }
        }
      }
    }
```

If you look close enough, you will see

```scala
val modsMap = fieldDefs.map { case ValDef(mods, name, _, _) => name -> mods }.toMap
```

`fieldDefs` comes from this call

```scala
val (fieldDefs, UnCtor(ctorMods, ctorVparamss, lvdefs) :: body) = rest.splitAt(indexOfCtor(rest))
```

So, it takes the body, splits it on the constructor, and assumes everything before then are `ValDef` instances.

TODO, should I file a bug against the compiler for this?  Might bite other macro developers...

## DefDef
This tree maps to `def foo: String = "foo"`

As case class

```scala
case class DefDef(mods: Modifiers, name: Name, tparams: List[TypeDef],
                    vparamss: List[List[ValDef]], tpt: Tree, rhs: Tree)
```

`vparamss` is nested `List[ValDef]` for currying.  `def foo(name: String)(age: Int)` will have `vparamss.size` equal 2, where `vparamss.head` is a `List[ValDef]` that matches the `name` group.

## TypeDef
When building generics into a function or a type, you are working with `TypeDef`.

As case class

```scala
case class TypeDef(mods: Modifiers, name: TypeName, tparams: List[TypeDef], rhs: Tree)
```

Playing with the tree

```scala
scala> q""" def foo[A](a: A): A = a """
scala> res3.tparams
res4: List[reflect.runtime.universe.TypeDef] = List(type A)

scala> res3.tparams.head.name
res6: reflect.runtime.universe.TypeName = A

scala> res3.tparams.head.tparams
res7: List[reflect.runtime.universe.TypeDef] = List()

scala> res3.tparams.head.rhs
res8: reflect.runtime.universe.Tree =

scala> res3.tparams.head.rhs.getClass
res9: Class[_ <: reflect.runtime.universe.Tree] = class scala.reflect.internal.Trees$TypeBoundsTree

```

## Literal
This tree maps to literals in the language such as `3` and `"foo"`

As case class

```scala
case class Literal(value: Constant)
```

## Constant
Represents a constant value, such as `3` or `"foo"`

As case class

```scala
case class Constant(value: Any)
```

## Ident
We saw that `Literal(Constant(3))` maps to `3`, but what about variable references?  This is where Ident comes in.

```scala
scala> val foo = "bar"
foo: String = bar

scala> q""" foo """
res20: reflect.runtime.universe.Ident = foo
```

As case class

```scala
case class Ident(name: Name)
```

## Block
This does what it sounds like, its a tree that maps to a scala block expression.

```scala
q"""
{
    val foo = 3
    foo
}
""".asInstanceOf[Block]
res2: reflect.runtime.universe.Block =
{
  val foo = 3;
  foo
}
```

As case class

```scala
case class Block(stats: List[Tree], expr: Tree)
```

`stats` are all the statements within the block
`expr` is the expression to return from the block.  In the case above, it returns `foo`

```scala
scala> res2.expr.asInstanceOf[Ident]
res5: reflect.runtime.universe.Ident = foo
```

## This
## Select
## Apply
## TypeApply
## TypeTree
## PackageDef
## ModuleDef
## LabelDef
## Import
## CaseDef
## Alternative
## Star
## Bind
## UnApply
## Function
## Assign
## AssignOrNamedArg
## If
## Match
## Return
## Try
## Throw
## New
## Typed
## Super
## RefTree
## ReferenceToBoxed
## Annotated
## SingletonTypeTree
## SelectFromTypeTree
## CompoundTypeTree
## AppliedTypeTree
## TypeBoundsTree
## ExistentialTypeTree
